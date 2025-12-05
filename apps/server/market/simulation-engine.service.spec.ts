/**
 * Testes unitários do Simulation-Engine.Service
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SimulationEngineService } from './simulation-engine.service';
import {
    MarketService,
    BrapiHistoricalPrice,
} from './market.service';
import { StrategyRegistry } from './strategy-registry.service';
import {
    SimulationBacktestResult,
    SimulationContext,
    StrategyExecutionType,
} from './simulation-engine.types';
import { SelectSimulation, SelectSimulationLeg } from '../db';

type QuoteHistoryResponse = Awaited<ReturnType<MarketService['getQuoteHistory']>>;

const buildQuoteHistoryResponse = (
    symbol: string,
    bars: BrapiHistoricalPrice[],
): QuoteHistoryResponse =>
({
    results: [
        {
            symbol,
            historicalDataPrice: bars,
        },
    ],
} as QuoteHistoryResponse);

describe('SimulationEngineService', () => {
    let service: SimulationEngineService;
    let marketService: jest.Mocked<MarketService>;
    let strategyRegistry: jest.Mocked<StrategyRegistry>;
    let strategyRunMock: jest.Mock<
        Promise<SimulationBacktestResult>,
        [SimulationContext]
    >;

    const buildBaseSimulation = (
        overrides?: Partial<SelectSimulation>,
    ): SelectSimulation => {
        const base = {
            id: 'sim-1',
            userId: 'user-1',
            strategyId: 'strategy-1',
            assetSymbol: 'PETR4',
            simulationName: 'Simulação de Teste',
            startDate: new Date('2024-01-01T00:00:00.000Z'),
            endDate: new Date('2024-01-10T00:00:00.000Z'),
            initialCapital: '10000.00',
            totalReturn: '0.00',
            returnPercentage: '0.0000',
            maxDrawdown: '0.0000',
            status: 'IN_PROGRESS' as const,
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
        };

        return { ...base, ...(overrides ?? {}) } as SelectSimulation;
    };

    const buildLeg = (
        overrides?: Partial<SelectSimulationLeg>,
    ): SelectSimulationLeg => {
        const base = {
            id: 'leg-1',
            simulationId: 'sim-1',
            instrumentType: 'CALL' as const,
            action: 'BUY' as const,
            quantity: 2,
            entryPrice: '10.50',
            strikePrice: '11.00',
            expiryDate: new Date('2024-02-01T00:00:00.000Z'),
            exitPrice: null,
            entryDate: new Date('2024-01-01T00:00:00.000Z'),
            exitDate: null,
            profitLoss: null,
        };

        return { ...base, ...(overrides ?? {}) } as SelectSimulationLeg;
    };

    const toEpoch = (iso: string): number =>
        Math.floor(new Date(iso).getTime() / 1000);

    beforeEach(async () => {
        marketService = {
            getQuoteHistory: jest.fn(),
        } as unknown as jest.Mocked<MarketService>;

        strategyRunMock = jest.fn<
            Promise<SimulationBacktestResult>,
            [SimulationContext]
        >();

        strategyRegistry = {
            getStrategy: jest
                .fn()
                .mockReturnValue({ run: strategyRunMock }),
        } as unknown as jest.Mocked<StrategyRegistry>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SimulationEngineService,
                {
                    provide: MarketService,
                    useValue: marketService,
                },
                {
                    provide: StrategyRegistry,
                    useValue: strategyRegistry,
                },
            ],
        }).compile();

        service = module.get<SimulationEngineService>(SimulationEngineService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('validações iniciais', () => {
        it('deve retornar zeros e NÃO chamar MarketService/StrategyRegistry quando datas forem inválidas', async () => {
            const sim = buildBaseSimulation({
                startDate: new Date('2024-01-10T00:00:00.000Z'),
                endDate: new Date('2024-01-01T00:00:00.000Z'),
            });

            const args = {
                ...sim,
                strategyExecutionType: 'BUY_HOLD_STOCK' as StrategyExecutionType,
                legs: [] as SelectSimulationLeg[],
            };

            const result = await service.runBacktest(args);

            expect(result).toEqual({
                totalReturn: 0,
                returnPercentage: 0,
                maxDrawdown: 0,
            });

            expect(marketService.getQuoteHistory).not.toHaveBeenCalled();
            expect(strategyRegistry.getStrategy).not.toHaveBeenCalled();
            expect(strategyRunMock).not.toHaveBeenCalled();
        });

        it('deve retornar zeros e NÃO chamar MarketService/StrategyRegistry quando capital inicial for inválido', async () => {
            const sim = buildBaseSimulation({
                initialCapital: '0.00',
            });

            const args = {
                ...sim,
                strategyExecutionType: 'BUY_HOLD_STOCK' as StrategyExecutionType,
                legs: [] as SelectSimulationLeg[],
            };

            const result = await service.runBacktest(args);

            expect(result).toEqual({
                totalReturn: 0,
                returnPercentage: 0,
                maxDrawdown: 0,
            });

            expect(marketService.getQuoteHistory).not.toHaveBeenCalled();
            expect(strategyRegistry.getStrategy).not.toHaveBeenCalled();
            expect(strategyRunMock).not.toHaveBeenCalled();
        });
    });

    describe('carregamento da série de preços e chamada da estratégia', () => {
        it('deve montar o SimulationContext corretamente e chamar strategy.run', async () => {
            const sim = buildBaseSimulation();
            const legs = [buildLeg()];

            const bars: BrapiHistoricalPrice[] = [
                {
                    date: toEpoch('2023-12-31T00:00:00.000Z'),
                    close: 9,
                },
                {
                    date: toEpoch('2024-01-01T00:00:00.000Z'),
                    close: 10,
                },
                {
                    date: toEpoch('2024-01-02T00:00:00.000Z'),
                    open: 11,
                },
                {
                    date: toEpoch('2024-01-10T00:00:00.000Z'),
                    close: 12,
                },
            ];

            const mockResponse = buildQuoteHistoryResponse('PETR4', bars);

            marketService.getQuoteHistory.mockResolvedValue(mockResponse);

            strategyRunMock.mockResolvedValue({
                totalReturn: 123.45,
                returnPercentage: 12.34,
                maxDrawdown: -5.67,
            });

            const args = {
                ...sim,
                strategyExecutionType: 'BUY_HOLD_STOCK' as StrategyExecutionType,
                legs,
            };

            const result = await service.runBacktest(args);

            expect(result.totalReturn).toBeCloseTo(123.45);
            expect(result.returnPercentage).toBeCloseTo(12.34);
            expect(result.maxDrawdown).toBeCloseTo(-5.67);

            expect(marketService.getQuoteHistory).toHaveBeenCalledTimes(1);
            const [symbol, range, interval] =
                marketService.getQuoteHistory.mock.calls[0];

            expect(symbol).toBe('PETR4');
            expect(typeof range).toBe('string');
            expect(interval).toBe('1d');

            expect(strategyRegistry.getStrategy).toHaveBeenCalledTimes(1);
            expect(strategyRegistry.getStrategy).toHaveBeenCalledWith(
                'BUY_HOLD_STOCK',
            );

            expect(strategyRunMock).toHaveBeenCalledTimes(1);
            const contextArg = strategyRunMock.mock.calls[0][0];

            expect(contextArg.id).toBe(sim.id);
            expect(contextArg.userId).toBe(sim.userId);
            expect(contextArg.assetSymbol).toBe(sim.assetSymbol);
            expect(contextArg.strategyExecutionType).toBe('BUY_HOLD_STOCK');
            expect(contextArg.initialCapital).toBe(10_000);

            expect(contextArg.legs).toHaveLength(1);
            const legCtx = contextArg.legs[0];

            expect(legCtx.id).toBe(legs[0].id);
            expect(legCtx.instrumentType).toBe('CALL');
            expect(legCtx.action).toBe('BUY');
            expect(legCtx.quantity).toBe(2);
            expect(legCtx.entryPrice).toBeCloseTo(10.5);
            expect(legCtx.strikePrice).toBeCloseTo(11.0);
            expect(legCtx.expiryDate).toEqual(legs[0].expiryDate);

            expect(contextArg.priceSeries).toHaveLength(3);
            expect(contextArg.priceSeries[0].close).toBe(10);
            expect(contextArg.priceSeries[1].close).toBe(11);
            expect(contextArg.priceSeries[2].close).toBe(12);
        });

        it('deve retornar zeros e NÃO chamar strategy.run quando série histórica for insuficiente (< 2 pontos)', async () => {
            const sim = buildBaseSimulation();
            const legs: SelectSimulationLeg[] = [];

            const bars: BrapiHistoricalPrice[] = [
                {
                    date: toEpoch('2024-01-05T00:00:00.000Z'),
                    close: 10,
                },
            ];

            const mockResponse = buildQuoteHistoryResponse('PETR4', bars);

            marketService.getQuoteHistory.mockResolvedValue(mockResponse);

            const args = {
                ...sim,
                strategyExecutionType: 'LONG_CALL' as StrategyExecutionType,
                legs,
            };

            const result = await service.runBacktest(args);

            expect(result).toEqual({
                totalReturn: 0,
                returnPercentage: 0,
                maxDrawdown: 0,
            });

            expect(strategyRegistry.getStrategy).not.toHaveBeenCalled();
            expect(strategyRunMock).not.toHaveBeenCalled();
        });

        it('deve retornar zeros quando ocorrer erro inesperado (ex.: BRAPI indisponível ou erro na estratégia)', async () => {
            const sim = buildBaseSimulation();
            const legs = [buildLeg()];

            marketService.getQuoteHistory.mockRejectedValue(
                new Error('BRAPI down'),
            );

            const args = {
                ...sim,
                strategyExecutionType: 'BUY_HOLD_STOCK' as StrategyExecutionType,
                legs,
            };

            const result = await service.runBacktest(args);

            expect(result).toEqual({
                totalReturn: 0,
                returnPercentage: 0,
                maxDrawdown: 0,
            });

            expect(strategyRegistry.getStrategy).not.toHaveBeenCalled();
            expect(strategyRunMock).not.toHaveBeenCalled();
        });
    });
});