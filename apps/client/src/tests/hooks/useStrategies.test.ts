import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { StrategyFilters, useStrategies } from '@/hooks/useStrategies';
import * as apiService from '@/services/api';

vi.mock('@/services/api', () => ({
    apiService: {
        getStrategies: vi.fn(),
    },
}));

type ApiServiceType = typeof apiService.apiService;
type GetStrategiesReturn = ReturnType<ApiServiceType['getStrategies']>;
type GetStrategiesResolved = Awaited<GetStrategiesReturn>;

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

            const { result: resultado } = renderHook(() =>
                useStrategies(filtrosPadrao)
            );

            await waitFor(() => {
                expect(resultado.current.loading).toBe(false);
            });

            expect(resultado.current.strategies).toEqual(estrategiasMock);
            expect(resultado.current.error).toBeNull();
        });

        it('deve tratar erro ao buscar estratégias', async () => {
            const mensagemErro = 'Falha ao buscar estratégias da turnê "Ten"';
            vi.mocked(apiService.apiService.getStrategies).mockRejectedValueOnce(
                new Error(mensagemErro)
            );

            const { result: resultado } = renderHook(() => useStrategies());

            await waitFor(() => {
                expect(resultado.current.loading).toBe(false);
            });

            expect(resultado.current.error).toBeDefined();
            expect(resultado.current.strategies).toEqual([]);
        });

        it('deve controlar corretamente o estado de carregamento', async () => {
            vi.mocked(apiService.apiService.getStrategies).mockResolvedValueOnce(
                {
                    data: estrategiasMock,
                } as unknown as GetStrategiesResolved
            );

            const { result: resultado } = renderHook(() => useStrategies());

            expect(resultado.current.loading).toBe(true);

            await waitFor(() => {
                expect(resultado.current.loading).toBe(false);
            });
        });
    });

    describe('Filtragem', () => {
        it('deve filtrar estratégias por nível de proficiência', async () => {
            vi.mocked(apiService.apiService.getStrategies).mockResolvedValueOnce(
                {
                    data: estrategiasMock,
                } as unknown as GetStrategiesResolved
            );

            const { result: resultado } = renderHook(() => useStrategies());

            await waitFor(() => {
                expect(resultado.current.loading).toBe(false);
            });

            const estrategiasFiltradasPorNivel =
                resultado.current.strategies.filter(
                    (estrategia) =>
                        estrategia.proficiencyLevel === 'intermediario'
                );
            expect(estrategiasFiltradasPorNivel.length).toBe(2);
        });

        it('deve filtrar estratégias pelo nome', async () => {
            vi.mocked(apiService.apiService.getStrategies).mockResolvedValueOnce(
                {
                    data: estrategiasMock,
                } as unknown as GetStrategiesResolved
            );

            const { result: resultado } = renderHook(() => useStrategies());

            await waitFor(() => {
                expect(resultado.current.loading).toBe(false);
            });

            const estrategiasFiltradasPorNome =
                resultado.current.strategies.filter((estrategia) =>
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

            const { result: resultado } = renderHook(() => useStrategies(filtrosPadrao));

            await waitFor(() => {
                expect(resultado.current.loading).toBe(false);
            });

            expect(resultado.current.strategies).toEqual([]);
            expect(resultado.current.error).toBeNull();
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
            const { result: resultado } = renderHook(() =>
                useStrategies(filtrosPadrao)
            );

            await waitFor(() => {
                expect(resultado.current.loading).toBe(false);
            });

            expect(resultado.current.error).toBeDefined();
            expect(resultado.current.strategies).toEqual([]);

            await act(async () => {
                await resultado.current.refetch();
            });

            expect(resultado.current.loading).toBe(false);
            expect(resultado.current.error).toBeNull();
            expect(resultado.current.strategies).toEqual(estrategiasMock);
        });
    });
});