import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { useSimulations, useDeleteSimulation } from '@/hooks/useSimulations';
import { useAuth } from '@/hooks/useAuth';
import * as apiModule from '@/services/api';
import { createAuthMock } from '../mocks/authMocks';

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@/services/api', () => ({
    apiService: {
        getUserSimulations: vi.fn(),
        deleteSimulation: vi.fn(),
    },
}));

const useAuthMocked = vi.mocked(useAuth);

type FnMock = ReturnType<typeof vi.fn>;

const apiServiceMock = apiModule.apiService as unknown as {
    getUserSimulations: FnMock;
    deleteSimulation: FnMock;
};

const createQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

const createWrapper =
    (queryClient: QueryClient) =>
        ({ children }: { children: ReactNode }) =>
        (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );

type ApiServiceType = typeof apiModule.apiService;
type GetUserSimsReturn = ReturnType<ApiServiceType['getUserSimulations']>;
type GetUserSimsResolved = Awaited<GetUserSimsReturn>;

describe('useSimulations', () => {
    const mockUserId = 'user-test-id';

    const baseUser = {
        id: mockUserId,
        username: 'testUser',
        email: 'test@example.com',
        experienceLevel: 'NOVICE',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useAuthMocked.mockReturnValue(createAuthMock());
    });

    it('não deve buscar simulações se o usuário não estiver logado', () => {
        useAuthMocked.mockReturnValue(
            createAuthMock({
                user: null,
                isAuthenticated: false,
            }),
        );

        const queryClient = createQueryClient();
        const wrapper = createWrapper(queryClient);

        const { result } = renderHook(() => useSimulations(), { wrapper });

        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
        expect(apiServiceMock.getUserSimulations).not.toHaveBeenCalled();
    });

    it('deve buscar e mapear as simulações do usuário', async () => {
        useAuthMocked.mockReturnValue(
            createAuthMock({
                user: baseUser,
                isAuthenticated: true,
            }),
        );

        const pastEndDate = '2020-01-01T00:00:00.000Z';
        const futureEndDate = '2999-01-01T00:00:00.000Z';

        const apiResponse = [
            {
                id: 'sim-1',
                simulationName: 'Simulação Completa',
                strategyName: 'Estratégia 1',
                assetSymbol: 'PETR4',
                ticker: null,
                startDate: '2023-01-01T00:00:00.000Z',
                endDate: pastEndDate,
                createdAt: '2023-01-01T10:00:00.000Z',
                initialCapital: '10000',
                totalReturn: '500.5',
                returnPercentage: '5,2%',
                maxDrawdown: '10.5',
            },
            {
                id: 'sim-2',
                simulationName: null,
                strategyName: 'Estratégia Secundária',
                assetSymbol: null,
                ticker: 'VALE3',
                startDate: null,
                endDate: futureEndDate,
                createdAt: '2023-01-02T10:00:00.000Z',
                initialCapital: undefined,
                totalReturn: 'inválido',
                returnPercentage: Number.NaN,
                maxDrawdown: null,
            },
        ];

        apiServiceMock.getUserSimulations.mockResolvedValue({
            data: apiResponse,
        } as GetUserSimsResolved);

        const queryClient = createQueryClient();
        const wrapper = createWrapper(queryClient);

        const { result } = renderHook(() => useSimulations(), { wrapper });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(apiServiceMock.getUserSimulations).toHaveBeenCalledWith(mockUserId);
        expect(apiServiceMock.getUserSimulations).toHaveBeenCalledTimes(1);

        const data = result.current.data;
        expect(data).toBeDefined();
        if (!data) return;

        expect(data).toHaveLength(2);

        const [sim1, sim2] = data;

        expect(sim1).toEqual({
            id: 'sim-1',
            simulationName: 'Simulação Completa',
            strategyName: 'Estratégia 1',
            assetSymbol: 'PETR4',
            status: 'CONCLUDED',
            startDate: '2023-01-01T00:00:00.000Z',
            endDate: pastEndDate,
            createdAt: '2023-01-01T10:00:00.000Z',
            initialCapital: 10000,
            totalReturn: 500.5,
            returnPercentage: 5.2,
            maxDrawdown: 10.5,
        });

        expect(sim2.id).toBe('sim-2');
        expect(sim2.simulationName).toBe('Estratégia Secundária');
        expect(sim2.strategyName).toBe('Estratégia Secundária');
        expect(sim2.assetSymbol).toBe('VALE3');
        expect(sim2.status).toBe('IN_PROGRESS');
        expect(sim2.startDate).toBe('');
        expect(sim2.endDate).toBe(futureEndDate);
        expect(sim2.createdAt).toBe('2023-01-02T10:00:00.000Z');
        expect(sim2.initialCapital).toBe(0);
        expect(sim2.totalReturn).toBeNull();
        expect(sim2.returnPercentage).toBeNull();
        expect(sim2.maxDrawdown).toBeNull();
    });

    it('deve lidar com erro ao buscar simulações', async () => {
        useAuthMocked.mockReturnValue(
            createAuthMock({
                user: baseUser,
                isAuthenticated: true,
            }),
        );

        const mockError = new Error('Erro ao buscar simulações');

        apiServiceMock.getUserSimulations.mockRejectedValue(mockError);

        const queryClient = createQueryClient();
        const wrapper = createWrapper(queryClient);

        const { result } = renderHook(() => useSimulations(), { wrapper });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toBeInstanceOf(Error);
    });
});

describe('useDeleteSimulation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve chamar apiService.deleteSimulation com o ID correto', async () => {
        const queryClient = createQueryClient();
        const wrapper = createWrapper(queryClient);

        apiServiceMock.deleteSimulation.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useDeleteSimulation(), { wrapper });

        await result.current.mutateAsync('sim-123');

        expect(apiServiceMock.deleteSimulation).toHaveBeenCalledWith('sim-123');
    });

    it('ao sucesso deve invalidar as queries de lista de simulações e estatísticas', async () => {
        const queryClient = createQueryClient();
        const wrapper = createWrapper(queryClient);

        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        apiServiceMock.deleteSimulation.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useDeleteSimulation(), { wrapper });

        await result.current.mutateAsync('sim-123');

        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ['user-simulations'],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ['simulation-statistics'],
        });
    });
});