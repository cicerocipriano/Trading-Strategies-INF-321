import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRecentSimulations } from '@/hooks/useRecentSimulations';
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
        getUserSimulations: vi.fn(),
    },
}));

const useAuthMocked = vi.mocked(useAuth);

type ApiServiceType = typeof apiService.apiService;
type GetUserSimsReturn = ReturnType<ApiServiceType['getUserSimulations']>;
type GetUserSimsResolved = Awaited<GetUserSimsReturn>;

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
                <QueryClientProvider client={queryClient} >
                    {children}
                </QueryClientProvider>
            );
        };

describe('useRecentSimulations', () => {
    const mockUserId = 'user-test-id';

    const mockSimulations = [
        {
            id: 'sim-1',
            simulationName: 'Simulação Teste 1',
            assetSymbol: 'PETR4',
            createdAt: '2023-01-01T10:00:00Z',
            returnPercentage: 15.5,
        },
        {
            id: 'sim-2',
            strategyName: 'Estratégia Teste 2',
            ticker: 'VALE3',
            createdAt: '2023-01-02T10:00:00Z',
            totalReturn: '10.2%',
        },
        {
            id: 'sim-3',
            createdAt: '2023-01-03T10:00:00Z',
            returnPercentage: '5,1',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        useAuthMocked.mockReturnValue(createAuthMock());
    });

    it('não deve buscar simulações se o usuário não estiver autenticado', () => {
        useAuthMocked.mockReturnValue(
            createAuthMock({
                user: null,
                isAuthenticated: false,
            }),
        );

        const wrapper = createWrapper();

        const { result } = renderHook(
            () => useRecentSimulations(),
            { wrapper },
        );

        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
        expect(apiService.apiService.getUserSimulations).not.toHaveBeenCalled();
    });

    it('deve buscar e retornar as simulações recentes do usuário', async () => {
        const user = {
            id: mockUserId,
            username: 'testUser',
            email: 'test@example.com',
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

        vi.mocked(apiService.apiService.getUserSimulations).mockResolvedValue({
            data: mockSimulations,
        } as unknown as GetUserSimsResolved);

        const wrapper = createWrapper();

        const { result } = renderHook(
            () => useRecentSimulations(),
            { wrapper },
        );

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(apiService.apiService.getUserSimulations).toHaveBeenCalledWith(
            mockUserId,
            {
                limit: 3,
                orderBy: 'recent',
            }
        );

        const expectedData = [
            {
                id: 'sim-1',
                simulationName: 'Simulação Teste 1',
                assetSymbol: 'PETR4',
                createdAt: '2023-01-01T10:00:00Z',
                returnPercentage: 15.5,
            },
            {
                id: 'sim-2',
                simulationName: 'Estratégia Teste 2',
                assetSymbol: 'VALE3',
                createdAt: '2023-01-02T10:00:00Z',
                returnPercentage: 10.2,
            },
            {
                id: 'sim-3',
                simulationName: 'Simulação',
                assetSymbol: 'Ativo',
                createdAt: '2023-01-03T10:00:00Z',
                returnPercentage: 5.1,
            },
        ];

        expect(result.current.data).toEqual(expectedData);
    });

    it('deve lidar com erro na busca de simulações', async () => {
        const user = {
            id: mockUserId,
            username: 'testUser',
            email: 'test@example.com',
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

        const mockError = new Error('Erro de API');

        vi.mocked(apiService.apiService.getUserSimulations).mockRejectedValue(
            mockError,
        );

        const wrapper = createWrapper();

        const { result } = renderHook(
            () => useRecentSimulations(),
            { wrapper },
        );

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toBeInstanceOf(Error);
    });
});