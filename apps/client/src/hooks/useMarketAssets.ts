import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export interface MarketAsset {
    symbol: string;     // Ex: PETR4.SA
    shortName: string;  // Ex: Petrobras
    exchange: string;   // Ex: São Paulo
    currency: string;   // Ex: BRL
}

/**
 * Hook para obter a lista básica de ativos da API /market/assets.
 * Usado para popular o select de "Ativo" no simulador.
 */
export function useMarketAssets() {
    return useQuery({
        queryKey: ['market-assets'],
        queryFn: async () => {
            const response = await apiService.getMarketAssets();
            return response.data as MarketAsset[];
        },
    });
}
