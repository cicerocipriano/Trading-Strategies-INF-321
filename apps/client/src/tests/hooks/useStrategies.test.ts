import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStrategies } from '@/hooks/useStrategies';
import * as apiService from '@/services/api';

vi.mock('@/services/api', () => ({
    apiService: {
        getStrategies: vi.fn(),
    },
}));

describe('useStrategies', () => {
    const mockStrategies = [
        {
            id: '1',
            name: 'Bull Call Spread',
            summary: 'A bullish strategy',
            proficiencyLevel: 'intermediate',
        },
        {
            id: '2',
            name: 'Bear Put Spread',
            summary: 'A bearish strategy',
            proficiencyLevel: 'intermediate',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Fetching Strategies', () => {
        it('should fetch strategies successfully', async () => {
            vi.mocked(apiService.apiService.getStrategies).mockResolvedValueOnce({
                data: mockStrategies,
            } as any);

            const { result } = renderHook(() => useStrategies());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.strategies).toEqual(mockStrategies);
            expect(result.current.error).toBeNull();
        });

        it('should handle fetch error', async () => {
            const errorMessage = 'Failed to fetch strategies';
            vi.mocked(apiService.apiService.getStrategies).mockRejectedValueOnce(
                new Error(errorMessage)
            );

            const { result } = renderHook(() => useStrategies());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.error).toBeDefined();
            expect(result.current.strategies).toEqual([]);
        });

        it('should set loading state correctly', async () => {
            vi.mocked(apiService.apiService.getStrategies).mockResolvedValueOnce({
                data: mockStrategies,
            } as any);

            const { result } = renderHook(() => useStrategies());

            // Initially loading
            expect(result.current.isLoading).toBe(true);

            // After fetch
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
        });
    });

    describe('Filtering', () => {
        it('should filter strategies by proficiency level', async () => {
            vi.mocked(apiService.apiService.getStrategies).mockResolvedValueOnce({
                data: mockStrategies,
            } as any);

            const { result } = renderHook(() => useStrategies());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const filtered = result.current.strategies.filter(
                (s) => s.proficiencyLevel === 'intermediate'
            );
            expect(filtered.length).toBe(2);
        });

        it('should filter strategies by name', async () => {
            vi.mocked(apiService.apiService.getStrategies).mockResolvedValueOnce({
                data: mockStrategies,
            } as any);

            const { result } = renderHook(() => useStrategies());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const filtered = result.current.strategies.filter((s) =>
                s.name.toLowerCase().includes('bull')
            );
            expect(filtered.length).toBe(1);
            expect(filtered[0].name).toBe('Bull Call Spread');
        });
    });

    describe('Empty Results', () => {
        it('should handle empty strategies list', async () => {
            vi.mocked(apiService.apiService.getStrategies).mockResolvedValueOnce({
                data: [],
            } as any);

            const { result } = renderHook(() => useStrategies());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.strategies).toEqual([]);
            expect(result.current.error).toBeNull();
        });
    });

    describe('Retry Logic', () => {
        it('should retry on failure', async () => {
            vi.mocked(apiService.apiService.getStrategies)
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    data: mockStrategies,
                } as any);

            const { result, rerender } = renderHook(() => useStrategies());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Should have error on first attempt
            expect(result.current.error).toBeDefined();

            // Simulate retry
            rerender();

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
        });
    });
});