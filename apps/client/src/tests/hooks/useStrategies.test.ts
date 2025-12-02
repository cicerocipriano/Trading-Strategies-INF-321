import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { StrategyFilters, useStrategies, useStrategy } from '@/hooks/useStrategies';
import * as apiService from '@/services/api';

vi.mock('@/services/api', () => ({
    apiService: {
        getStrategies: vi.fn(),
        getStrategy: vi.fn(),
    },
}));

type ApiServiceType = typeof apiService.apiService;
type GetStrategiesReturn = ReturnType<ApiServiceType['getStrategies']>;
type GetStrategiesResolved = Awaited<GetStrategiesReturn>;

type GetStrategyReturn = ReturnType<ApiServiceType['getStrategy']>;
type GetStrategyResolved = Awaited<GetStrategyReturn>;

describe('useStrategies', () => {
    const estrategiasMock = [
        {
            id: '1',
            name: 'Ten Breakout',
            summary: 'A grunge strategy',
            proficiencyLevel: 'intermediario',
        },
        {
            id: '2',
            name: 'Vs Momentum',
            summary: 'A groove strategy',
            proficiencyLevel: 'intermediario',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Busca de Estratégias', () => {
        it('deve buscar estratégias com sucesso', async () => {
            vi.mocked(apiService.apiService.getStrategies).mockResolvedValueOnce(
                {
                    data: estrategiasMock,
                } as unknown as GetStrategiesResolved
            );

            const filtrosPadrao: StrategyFilters = {};

            const { result } = renderHook(() => useStrategies(filtrosPadrao));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.strategies).toEqual(estrategiasMock);
            expect(result.current.error).toBeNull();
        });

        it('deve tratar erro não Axios ao buscar estratégias com mensagem genérica', async () => {
            const mensagemErro = 'Falha ao buscar estratégias da turnê "Ten"';
            vi.mocked(apiService.apiService.getStrategies).mockRejectedValueOnce(
                new Error(mensagemErro)
            );

            const { result } = renderHook(() => useStrategies());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            // aqui garantimos explicitamente a mensagem do hook
            expect(result.current.error).toBe('Erro ao buscar estratégias');
            expect(result.current.strategies).toEqual([]);
        });

        it('deve controlar corretamente o estado de carregamento', async () => {
            vi.mocked(apiService.apiService.getStrategies).mockResolvedValueOnce(
                {
                    data: estrategiasMock,
                } as unknown as GetStrategiesResolved
            );

            const { result } = renderHook(() => useStrategies());

            // imediatamente após montagem
            expect(result.current.loading).toBe(true);

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });
        });
    });

    describe('Filtragem (lado do consumidor)', () => {
        it('deve filtrar estratégias por nível de proficiência', async () => {
            vi.mocked(apiService.apiService.getStrategies).mockResolvedValueOnce(
                {
                    data: estrategiasMock,
                } as unknown as GetStrategiesResolved
            );

            const { result } = renderHook(() => useStrategies());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            const estrategiasFiltradasPorNivel =
                result.current.strategies.filter(
                    (estrategia) => estrategia.proficiencyLevel === 'intermediario'
                );
            expect(estrategiasFiltradasPorNivel.length).toBe(2);
        });

        it('deve filtrar estratégias pelo nome', async () => {
            vi.mocked(apiService.apiService.getStrategies).mockResolvedValueOnce(
                {
                    data: estrategiasMock,
                } as unknown as GetStrategiesResolved
            );

            const { result } = renderHook(() => useStrategies());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            const estrategiasFiltradasPorNome =
                result.current.strategies.filter((estrategia) =>
                    estrategia.name.toLowerCase().includes('ten')
                );

            expect(estrategiasFiltradasPorNome.length).toBe(1);
            expect(estrategiasFiltradasPorNome[0].name).toBe('Ten Breakout');
        });
    });

    describe('Resultados Vazios', () => {
        it('deve tratar corretamente lista vazia de estratégias', async () => {
            vi.mocked(apiService.apiService.getStrategies).mockResolvedValueOnce(
                {
                    data: [],
                } as unknown as GetStrategiesResolved
            );

            const filtrosPadrao: StrategyFilters = {};

            const { result } = renderHook(() => useStrategies(filtrosPadrao));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.strategies).toEqual([]);
            expect(result.current.error).toBeNull();
        });
    });

    describe('Lógica de Retentativa', () => {
        it('deve tentar novamente após falha inicial', async () => {
            vi.mocked(apiService.apiService.getStrategies)
                .mockRejectedValueOnce(new Error('Erro de rede ao carregar'))
                .mockResolvedValueOnce({
                    data: estrategiasMock,
                } as unknown as GetStrategiesResolved);

            const filtrosPadrao: StrategyFilters = {};
            const { result } = renderHook(() => useStrategies(filtrosPadrao));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.error).toBeDefined();
            expect(result.current.strategies).toEqual([]);

            await act(async () => {
                await result.current.refetch();
            });

            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.strategies).toEqual(estrategiasMock);
        });
    });

    describe('Integração com filtros (lado do hook)', () => {
        it('deve chamar getStrategies com os filtros fornecidos', async () => {
            const filtros: StrategyFilters = {
                proficiencyLevel: 'iniciante',
                marketOutlook: 'bullish',
            };

            vi.mocked(apiService.apiService.getStrategies).mockResolvedValueOnce(
                { data: [] } as unknown as GetStrategiesResolved
            );

            renderHook(() => useStrategies(filtros));

            await waitFor(() => {
                expect(apiService.apiService.getStrategies).toHaveBeenCalledTimes(1);
            });

            expect(apiService.apiService.getStrategies).toHaveBeenCalledWith(filtros);
        });

        it('deve refazer a busca quando os filtros mudam', async () => {
            const filtrosIniciais: StrategyFilters = {
                proficiencyLevel: 'iniciante',
            };
            const filtrosAtualizados: StrategyFilters = {
                proficiencyLevel: 'avancado',
                marketOutlook: 'bearish',
            };

            vi.mocked(apiService.apiService.getStrategies)
                .mockResolvedValueOnce({ data: [] } as unknown as GetStrategiesResolved)
                .mockResolvedValueOnce({ data: estrategiasMock } as unknown as GetStrategiesResolved);

            const { rerender } = renderHook(
                (props: StrategyFilters) => useStrategies(props),
                { initialProps: filtrosIniciais }
            );

            await waitFor(() => {
                expect(apiService.apiService.getStrategies).toHaveBeenCalledTimes(1);
            });
            expect(
                vi.mocked(apiService.apiService.getStrategies).mock.calls[0][0]
            ).toEqual(filtrosIniciais);

            rerender(filtrosAtualizados);

            await waitFor(() => {
                expect(apiService.apiService.getStrategies).toHaveBeenCalledTimes(2);
            });

            expect(
                vi.mocked(apiService.apiService.getStrategies).mock.calls[1][0]
            ).toEqual(filtrosAtualizados);
        });
    });

    describe('Tratamento de erros Axios específicos', () => {
        it('deve usar mensagem de erro da API quando disponível (AxiosError)', async () => {
            const mensagemApi = 'Erro ao buscar estratégias';

            const axiosErrorComMensagem = {
                isAxiosError: true,
                response: {
                    data: {
                        message: mensagemApi,
                    },
                },
            } as unknown as Error;

            vi.mocked(apiService.apiService.getStrategies).mockRejectedValueOnce(
                axiosErrorComMensagem
            );

            const { result } = renderHook(() => useStrategies());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.error).toBe(mensagemApi);
            expect(result.current.strategies).toEqual([]);
        });

        it('deve usar mensagem genérica quando AxiosError não traz mensagem', async () => {
            const axiosErrorSemMensagem = {
                isAxiosError: true,
                response: {
                    data: {},
                },
            } as unknown as Error;

            vi.mocked(apiService.apiService.getStrategies).mockRejectedValueOnce(
                axiosErrorSemMensagem
            );

            const { result } = renderHook(() => useStrategies());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.error).toBe('Erro ao buscar estratégias');
            expect(result.current.strategies).toEqual([]);
        });
    });
});

describe('useStrategy', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const strategyMock = {
        id: '1',
        name: 'Bull Call Spread',
        summary: 'Bullish com risco limitado',
        description: 'Detalhes da estratégia',
        proficiencyLevel: 'intermediario',
        marketOutlook: 'bullish',
        volatilityView: 'alta',
        riskProfile: 'medio',
        rewardProfile: 'medio',
        strategyType: 'vertical_spread',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        legs: [],
    };

    it('deve buscar estratégia por id com sucesso', async () => {
        vi.mocked(apiService.apiService.getStrategy).mockResolvedValueOnce(
            {
                data: strategyMock,
            } as unknown as GetStrategyResolved
        );

        const { result } = renderHook(() => useStrategy('1'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.strategy).toEqual(strategyMock);
        expect(result.current.error).toBeNull();
    });

    it('não deve buscar quando id é vazio', async () => {
        const { result } = renderHook(() => useStrategy(''));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(apiService.apiService.getStrategy).not.toHaveBeenCalled();
        expect(result.current.strategy).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('deve tratar erro Axios com mensagem em useStrategy', async () => {
        const mensagemApi = 'Erro específico ao buscar estratégia';

        const axiosErrorComMensagem = {
            isAxiosError: true,
            response: { data: { message: mensagemApi } },
        } as unknown as Error;

        vi.mocked(apiService.apiService.getStrategy).mockRejectedValueOnce(
            axiosErrorComMensagem
        );

        const { result } = renderHook(() => useStrategy('1'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe(mensagemApi);
        expect(result.current.strategy).toBeNull();
    });

    it('deve usar mensagem genérica em erro não Axios em useStrategy', async () => {
        vi.mocked(apiService.apiService.getStrategy).mockRejectedValueOnce(
            new Error('Falha na API')
        );

        const { result } = renderHook(() => useStrategy('1'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Erro ao buscar estratégia');
        expect(result.current.strategy).toBeNull();
    });
});