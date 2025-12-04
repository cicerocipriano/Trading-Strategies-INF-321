import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSimulationStatistics } from '@/hooks/useSimulationStatistics';
import { useAuth } from '@/hooks/useAuth';
import * as apiService from '@/services/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createAuthMock } from '../mocks/authMocks';

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@/services/api', () => ({
    apiService: {
        getUserStatistics: vi.fn(),
    },
}));

const useAuthMocked = vi.mocked(useAuth);

type ApiServiceType = typeof apiService.apiService;
type GetUserStatsReturn = ReturnType<ApiServiceType['getUserStatistics']>;
type GetUserStatsResolved = Awaited<GetUserStatsReturn>;

const createWrapper =
    () =>
        ({ children }: { children: ReactNode }) => {
            const queryClient = new QueryClient({
                defaultOptions: {
                    queries: {
                        retry: false,
                    },
                },
            });

            return (
                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
            );
        };

describe('useSimulationStatistics', () => {
    const mockUserId = 'user-stats-id';

    const mockStatistics = {
        totalSimulations: 100,
        profitableSimulations: 65,
        losingSimulations: 35,
        winRate: '65%',
        avgReturn: '12.5%',
        simulatedCapital: 50000,
    };

    const defaultStatistics = {
        totalSimulations: 0,
        profitableSimulations: 0,
        losingSimulations: 0,
        winRate: '0%',
        avgReturn: '0%',
        simulatedCapital: 0,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useAuthMocked.mockReturnValue(createAuthMock());
    });

    it('deve retornar estatísticas padrão se o usuário não estiver autenticado', async () => {
        useAuthMocked.mockReturnValue(
            createAuthMock({
                user: null,
                isAuthenticated: false,
            }),
        );

        const wrapper = createWrapper();

        const { result } = renderHook(
            () => useSimulationStatistics(),
            { wrapper },
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(apiService.apiService.getUserStatistics).not.toHaveBeenCalled();
        expect(result.current.data).toEqual(defaultStatistics);
    });

    it('deve buscar e retornar as estatísticas de simulação do usuário', async () => {
        const user = {
            id: mockUserId,
            username: 'statsUser',
            email: 'stats@example.com',
            experienceLevel: 'NOVICE',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
        };

        useAuthMocked.mockReturnValue(
            createAuthMock({
                user,
                isAuthenticated: true,
            }),
        );

        vi.mocked(apiService.apiService.getUserStatistics).mockResolvedValue({
            data: mockStatistics,
        } as unknown as GetUserStatsResolved);

        const wrapper = createWrapper();

        const { result } = renderHook(
            () => useSimulationStatistics(),
            { wrapper },
        );

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(apiService.apiService.getUserStatistics).toHaveBeenCalledWith(
            mockUserId,
        );
        expect(result.current.data).toEqual(mockStatistics);
    });

    it('deve lidar com erro na busca de estatísticas', async () => {
        const user = {
            id: mockUserId,
            username: 'statsUser',
            email: 'stats@example.com',
            experienceLevel: 'NOVICE',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
        };

        useAuthMocked.mockReturnValue(
            createAuthMock({
                user,
                isAuthenticated: true,
            }),
        );

        const mockError = new Error('Erro ao buscar estatísticas');

        vi.mocked(apiService.apiService.getUserStatistics).mockRejectedValue(
            mockError,
        );

        const wrapper = createWrapper();

        const { result } = renderHook(
            () => useSimulationStatistics(),
            { wrapper },
        );

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toBeInstanceOf(Error);
    });
});