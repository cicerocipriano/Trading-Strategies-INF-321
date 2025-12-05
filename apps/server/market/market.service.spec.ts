/**
 * Testes unitários do MarketService
 */
import { Test, TestingModule } from '@nestjs/testing';
import axios, { AxiosResponse } from 'axios';
import { MarketService, BrapiQuoteResponse } from './market.service';

jest.mock('axios');

describe('MarketService', () => {
    let service: MarketService;
    let mockedAxios: jest.Mocked<typeof axios>;

    const originalEnv = { ...process.env };

    beforeEach(async () => {
        jest.clearAllMocks();
        mockedAxios = axios as jest.Mocked<typeof axios>;

        process.env.BRAPI_BASE_URL = 'https://test-brapi.io/api';
        process.env.BRAPI_API_KEY = 'test-token';

        const module: TestingModule = await Test.createTestingModule({
            providers: [MarketService],
        }).compile();

        service = module.get<MarketService>(MarketService);
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    describe('getBasicAssets', () => {
        it('deve buscar ativos na brapi quando não há cache', async () => {
            const axiosResponse = {
                data: {
                    results: [
                        {
                            symbol: 'PETR4',
                            shortName: 'Petrobras PN',
                            currency: 'BRL',
                        },
                    ],
                },
            } as unknown as AxiosResponse<BrapiQuoteResponse>;

            mockedAxios.get.mockResolvedValue(axiosResponse);

            const assets = await service.getBasicAssets();

            expect(assets.length).toBeGreaterThan(0);
            expect(assets[0]).toHaveProperty('symbol');
            expect(assets[0]).toHaveProperty('shortName');
            expect(assets[0]).toHaveProperty('exchange', 'B3');
            expect(assets[0]).toHaveProperty('currency');

            expect(mockedAxios.get).toHaveBeenCalled();

            const tickersChamados = mockedAxios.get.mock.calls.map((call) =>
                String(call[0]).split('/').pop(),
            );

            expect(tickersChamados).toEqual(
                expect.arrayContaining(['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'WEGE3']),
            );
        });

        it('deve reaproveitar o cache e não chamar a brapi novamente na segunda chamada', async () => {
            const axiosResponse = {
                data: {
                    results: [
                        {
                            symbol: 'PETR4',
                            shortName: 'Petrobras PN',
                            currency: 'BRL',
                        },
                    ],
                },
            } as unknown as AxiosResponse<BrapiQuoteResponse>;

            mockedAxios.get.mockResolvedValue(axiosResponse);

            const firstCall = await service.getBasicAssets();
            expect(firstCall.length).toBeGreaterThan(0);
            const callsAfterFirst = mockedAxios.get.mock.calls.length;

            const secondCall = await service.getBasicAssets();
            const callsAfterSecond = mockedAxios.get.mock.calls.length;

            expect(secondCall).toEqual(firstCall);
            expect(callsAfterSecond).toBe(callsAfterFirst);
        });

        it('deve usar fallback local se a brapi não retornar resultados válidos', async () => {
            const axiosResponse = {
                data: {
                    results: [],
                },
            } as unknown as AxiosResponse<BrapiQuoteResponse>;

            mockedAxios.get.mockResolvedValue(axiosResponse);

            const assets = await service.getBasicAssets();

            expect(assets.length).toBeGreaterThanOrEqual(5);
            expect(assets[0]).toHaveProperty('exchange', 'B3');
            expect(assets[0]).toHaveProperty('currency', 'BRL');
        });

        it('deve chamar a brapi com config válida (timeout, headers) e incluir token se disponível', async () => {
            const axiosResponse = {
                data: {
                    results: [
                        {
                            symbol: 'PETR4',
                            shortName: 'Petrobras PN',
                            currency: 'BRL',
                        },
                    ],
                },
            } as unknown as AxiosResponse<BrapiQuoteResponse>;

            mockedAxios.get.mockResolvedValue(axiosResponse);

            await service.getBasicAssets();

            const call = mockedAxios.get.mock.calls.find((c) =>
                String(c[0]).includes('/quote/PETR4'),
            );

            expect(call).toBeDefined();
            if (!call) {
                throw new Error('Chamada para PETR4 não encontrada');
            }

            const url = call[0];
            const config = call[1];

            expect(typeof url).toBe('string');
            expect(url.includes('/quote/PETR4')).toBe(true);

            expect(config).toBeDefined();
            if (!config) {
                throw new Error('Config da chamada axios.get não encontrada');
            }

            expect(config.timeout).toBe(10000);
            expect(config.headers).toMatchObject({
                Accept: 'application/json,text/plain,*/*',
            });

            const params = config.params as Record<string, unknown> | undefined;
            expect(params).toBeDefined();

            if (params) {
                if (params.token) {
                    expect(typeof params.token).toBe('string');
                    expect(String(params.token).length).toBeGreaterThan(0);
                }
            }
        });
    });

    describe('refreshBasicAssetsCache', () => {
        it('deve limpar e reconstruir o cache', async () => {
            const axiosResponse = {
                data: {
                    results: [
                        {
                            symbol: 'PETR4',
                            shortName: 'Petrobras PN',
                            currency: 'BRL',
                        },
                    ],
                },
            } as unknown as AxiosResponse<BrapiQuoteResponse>;

            mockedAxios.get.mockResolvedValue(axiosResponse);

            const first = await service.getBasicAssets();
            expect(first.length).toBeGreaterThan(0);

            const callsBeforeRefresh = mockedAxios.get.mock.calls.length;
            const refreshed = await service.refreshBasicAssetsCache();
            const callsAfterRefresh = mockedAxios.get.mock.calls.length;

            expect(refreshed.length).toBeGreaterThan(0);
            expect(callsAfterRefresh).toBeGreaterThan(callsBeforeRefresh);
        });
    });

    describe('getQuoteHistory', () => {
        it('deve chamar a brapi com os parâmetros básicos corretos (range/interval) e retornar o data', async () => {
            const mockResponseData: BrapiQuoteResponse = {
                results: [
                    {
                        symbol: 'PETR4',
                        historicalDataPrice: [{ date: 1704067200, close: 30.5 }],
                    },
                ],
            };

            const axiosResponse = {
                data: mockResponseData,
            } as unknown as AxiosResponse<BrapiQuoteResponse>;

            mockedAxios.get.mockResolvedValue(axiosResponse);

            const result = await service.getQuoteHistory('PETR4', '3mo', '1d');

            expect(result).toEqual(mockResponseData);
            expect(mockedAxios.get).toHaveBeenCalledTimes(1);

            const [url, config] = mockedAxios.get.mock.calls[0];

            expect(typeof url).toBe('string');
            expect((url as string).endsWith('/quote/PETR4')).toBe(true);

            expect(config).toBeDefined();
            if (!config) {
                throw new Error('Config da chamada axios.get não encontrada');
            }

            const params = config.params as Record<string, unknown> | undefined;
            expect(params).toMatchObject({
                range: '3mo',
                interval: '1d',
            });

            if (params && params.token) {
                expect(typeof params.token).toBe('string');
                expect(String(params.token).length).toBeGreaterThan(0);
            }

            expect(config.timeout).toBe(10000);
        });
    });
});