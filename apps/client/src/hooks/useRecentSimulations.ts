import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useAuth } from './useAuth';

export interface SimulationSummary {
    id: string;
    simulationName: string;
    assetSymbol: string;
    createdAt: string;
    returnPercentage: number | null;
}

interface SimulationApiDTO {
    id: string;
    simulationName?: string | null;
    strategyName?: string | null;
    assetSymbol?: string | null;
    ticker?: string | null;
    createdAt: string;
    returnPercentage?: number | string | null;
    totalReturn?: number | string | null;
}

async function fetchRecentSimulations(userId: string): Promise<SimulationSummary[]> {
    const response = await apiService.getUserSimulations(userId, {
        limit: 3,
        orderBy: 'recent',
    });

    const data = response.data as SimulationApiDTO[];

    return data.map((sim) => {
        const rawReturn = sim.returnPercentage ?? sim.totalReturn ?? null;

        let parsedReturn: number | null = null;
        if (typeof rawReturn === 'number') {
            parsedReturn = rawReturn;
        } else if (typeof rawReturn === 'string') {
            const normalized = rawReturn.replace('%', '').replace(',', '.');
            const n = Number(normalized);
            parsedReturn = Number.isNaN(n) ? null : n;
        }

        return {
            id: sim.id,
            simulationName:
                sim.simulationName ??
                sim.strategyName ??
                'Simulação',
            assetSymbol: sim.assetSymbol ?? sim.ticker ?? 'Ativo',
            createdAt: sim.createdAt,
            returnPercentage: parsedReturn,
        };
    });
}

type AuthUserWithId = {
    id: string;
};

export function useRecentSimulations() {
    const { user } = useAuth();
    const userId = (user as AuthUserWithId | null | undefined)?.id;

    return useQuery({
        queryKey: ['recent-simulations', userId],
        enabled: !!userId,
        queryFn: () => {
            if (!userId) return Promise.resolve<SimulationSummary[]>([]);
            return fetchRecentSimulations(userId);
        },
    });
}
