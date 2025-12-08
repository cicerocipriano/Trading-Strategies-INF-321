import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { useMarketAssets, type MarketAsset } from '@/hooks/useMarketAssets';
import * as apiModule from '@/services/api';

vi.mock('@/services/api', () => ({
    apiService: {
        getMarketAssets: vi.fn(),
    },
}));

type FnMock = ReturnType<typeof vi.fn>;

const apiServiceMock = apiModule.apiService as unknown as {
    getMarketAssets: FnMock;
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
            <QueryClientProvider client={queryClient} >
                {children}
            </QueryClientProvider>
        );

type ApiServiceType = typeof apiModule.apiService;
type GetAssetsReturn = ReturnType<ApiServiceType['getMarketAssets']>;
type GetAssetsResolved = Awaited<GetAssetsReturn>;

describe('useMarketAssets', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve buscar e retornar a lista de ativos de mercado', async () => {
        const mockAssets: MarketAsset[] = [
            {
                symbol: 'PETR4.SA',
                shortName: 'Petrobras',
                exchange: 'São Paulo',
                currency: 'BRL',
            },
            {
                symbol: 'VALE3.SA',
                shortName: 'Vale',
                exchange: 'São Paulo',
                currency: 'BRL',
            },
        ];

        apiServiceMock.getMarketAssets.mockResolvedValue({
            data: mockAssets,
        } as GetAssetsResolved);

        const queryClient = createQueryClient();
        const wrapper = createWrapper(queryClient);

        const { result } = renderHook(() => useMarketAssets(), { wrapper });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(apiServiceMock.getMarketAssets).toHaveBeenCalledTimes(1);

        const data = result.current.data;
        expect(data).toEqual(mockAssets);
    });

    it('deve lidar com erro ao buscar ativos de mercado', async () => {
        const mockError = new Error('Erro ao buscar ativos');

        apiServiceMock.getMarketAssets.mockRejectedValue(mockError);

        const queryClient = createQueryClient();
        const wrapper = createWrapper(queryClient);

        const { result } = renderHook(() => useMarketAssets(), { wrapper });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toBeInstanceOf(Error);
    });
});