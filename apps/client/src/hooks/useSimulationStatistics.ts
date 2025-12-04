import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useAuth } from './useAuth';

export interface SimulationStatistics {
    totalSimulations: number;
    profitableSimulations: number;
    losingSimulations: number;
    winRate: string;
    avgReturn: string;
    simulatedCapital: number;
}

type AuthUserWithId = {
    id: string;
};

async function fetchSimulationStatistics(userId: string): Promise<SimulationStatistics> {
    const response = await apiService.getUserStatistics(userId);
    return response.data as SimulationStatistics;
}

const defaultStatistics: SimulationStatistics = {
    totalSimulations: 0,
    profitableSimulations: 0,
    losingSimulations: 0,
    winRate: '0%',
    avgReturn: '0%',
    simulatedCapital: 0,
};

export function useSimulationStatistics() {
    const { user } = useAuth();
    const userId = (user as AuthUserWithId | null | undefined)?.id;

    return useQuery<SimulationStatistics>({
        queryKey: ['simulation-statistics', userId],
        queryFn: () => {
            if (!userId) {
                return Promise.resolve(defaultStatistics);
            }

            return fetchSimulationStatistics(userId);
        },
    });
}
