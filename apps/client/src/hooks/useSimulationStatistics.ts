import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useAuth } from './useAuth';

export interface SimulationStatistics {
    totalSimulations: number;
    profitableSimulations: number;
    losingSimulations: number;
    winRate: string;
    avgReturn: string;
}

async function fetchSimulationStatistics(userId: string): Promise<SimulationStatistics> {
    const { data } = await apiService.getUserStatistics(userId);
    return data as SimulationStatistics;
}

export function useSimulationStatistics() {
    const { user } = useAuth();
    const userId = (user as any)?.id;

    return useQuery({
        queryKey: ['simulation-statistics', userId],
        enabled: !!userId,
        queryFn: () => {
            if (!userId) {
                return Promise.resolve({
                    totalSimulations: 0,
                    profitableSimulations: 0,
                    losingSimulations: 0,
                    winRate: '0%',
                    avgReturn: '0%',
                });
            }

            return fetchSimulationStatistics(userId);
        },
    });
}
