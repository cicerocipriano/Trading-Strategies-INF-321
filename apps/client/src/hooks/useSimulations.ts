import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useAuth } from './useAuth';

export type SimulationStatus = 'CONCLUDED' | 'IN_PROGRESS';

export interface SimulationListItem {
    id: string;
    simulationName: string;
    strategyName?: string;
    assetSymbol: string;
    status: SimulationStatus;
    startDate: string;
    endDate: string;
    createdAt: string;
    initialCapital: number;
    totalReturn: number | null;
    returnPercentage: number | null;
    maxDrawdown?: number | null;
}

interface SimulationApiDTO {
    id: string;
    simulationName?: string | null;
    strategyName?: string | null;
    assetSymbol?: string | null;
    ticker?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    createdAt: string;
    initialCapital?: string | number | null;
    totalReturn?: string | number | null;
    returnPercentage?: string | number | null;
    maxDrawdown?: string | number | null;
}

type AuthUserWithId = {
    id: string;
};

/**
 * Converte string/number nullable em number ou null
 */
function parseNumberField(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return Number.isNaN(value) ? null : value;

    const normalized = value.replace('%', '').replace(',', '.').trim();
    const n = Number(normalized);
    return Number.isNaN(n) ? null : n;
}

/**
 * Deriva o status da simulação.
 * Aqui considerei: se a data de término já passou → CONCLUDED,
 * caso contrário → IN_PROGRESS.
 */
function deriveStatus(sim: SimulationApiDTO): SimulationStatus {
    if (sim.endDate) {
        const end = new Date(sim.endDate);
        if (!Number.isNaN(end.getTime()) && end.getTime() < Date.now()) {
            return 'CONCLUDED';
        }
    }
    return 'IN_PROGRESS';
}

/**
 * Mapeia o DTO bruto da API para o formato que a tela de Simulações usa.
 */
function mapToSimulationListItem(sim: SimulationApiDTO): SimulationListItem {
    const initialCapitalNumber = parseNumberField(sim.initialCapital) ?? 0;
    const totalReturnNumber = parseNumberField(sim.totalReturn);
    const returnPercentageNumber = parseNumberField(sim.returnPercentage);
    const maxDrawdownNumber = parseNumberField(sim.maxDrawdown);

    const status = deriveStatus(sim);

    return {
        id: sim.id,
        simulationName:
            sim.simulationName ??
            sim.strategyName ??
            'Simulação',
        strategyName: sim.strategyName ?? undefined,
        assetSymbol: sim.assetSymbol ?? sim.ticker ?? 'Ativo',

        status,

        startDate: sim.startDate ?? '',
        endDate: sim.endDate ?? '',
        createdAt: sim.createdAt,

        initialCapital: initialCapitalNumber,
        totalReturn: totalReturnNumber,
        returnPercentage: returnPercentageNumber,
        maxDrawdown: maxDrawdownNumber,
    };
}

/**
 * Hook simples para listar TODAS as simulações do usuário logado.
 * Usa GET /simulations/user/:userId (sem limit → traz tudo ordenado por data).
 */
export function useSimulations() {
    const { user } = useAuth();
    const userId = (user as AuthUserWithId | null | undefined)?.id;

    return useQuery({
        queryKey: ['user-simulations', userId],
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) {
                return [] as SimulationListItem[];
            }

            const response = await apiService.getUserSimulations(userId);
            const data = response.data as SimulationApiDTO[];

            return data.map(mapToSimulationListItem);
        },
    });
}
