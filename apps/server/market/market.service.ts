import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface MarketAsset {
    symbol: string;     // Ex: PETR4
    shortName: string;  // Ex: Petrobras PN
    exchange: string;   // Ex: B3
    currency: string;   // Ex: BRL
}

export interface BrapiHistoricalPrice {
    date?: number;   // epoch em segundos
    close?: number;
    open?: number;
    high?: number;
    low?: number;
    volume?: number;
}

export interface BrapiQuoteResult {
    symbol: string;
    shortName?: string;
    longName?: string;
    regularMarketPrice?: number;
    currency?: string;
    regularMarketTime?: string;
    historicalDataPrice?: BrapiHistoricalPrice[];
}

export interface BrapiQuoteResponse {
    results?: BrapiQuoteResult[];
}

const BRAPI_BASE_URL =
    process.env.BRAPI_BASE_URL ?? 'https://brapi.dev/api';
const BRAPI_API_KEY = process.env.BRAPI_API_KEY ?? '';

@Injectable()
export class MarketService {
    private readonly logger = new Logger(MarketService.name);

    // 1) Mapa de nomes "bonitos", por símbolo
    private readonly friendlyNames: Record<string, string> = {
        PETR4: 'Petrobras PN',
        VALE3: 'Vale ON',
        ITUB4: 'Itaú Unibanco PN',
        BBDC4: 'Bradesco PN',
        WEGE3: 'WEG ON',
        // depois você pode ir adicionando mais aqui
    };

    // 2) Cache em memória para a lista básica de ativos
    private basicAssetsCache:
        | { data: MarketAsset[]; expiresAt: number }
        | null = null;

    // TTL do cache (ex.: 10 minutos)
    private readonly CACHE_TTL_MS = 10 * 60 * 1000;

    /**
     * Normaliza o shortName vindo da brapi:
     *  - remove espaços duplicados
     *  - trim
     *  - coloca em "Title Case", mas mantém siglas curtas (PN, ON, N1, N2, etc.) em maiúsculas
     */
    private normalizeShortName(symbol: string, rawName?: string): string {
        if (!rawName) return symbol;

        const collapsed = rawName.replace(/\s+/g, ' ').trim();
        if (!collapsed) return symbol;

        const parts = collapsed.split(' ');

        const normalized = parts
            .map((part) => {
                // Siglas curtas em maiúsculo
                if (part.length <= 3 && /^[A-Z0-9]+$/.test(part)) {
                    return part;
                }

                // Caso geral
                return part.charAt(0) + part.slice(1).toLowerCase();
            })
            .join(' ');

        return normalized;
    }

    /**
     * Fallback local se a API externa falhar
     */
    private getFallbackAssets(): MarketAsset[] {
        const symbols = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'WEGE3'] as const;

        return symbols.map((symbol) => ({
            symbol,
            shortName: this.friendlyNames[symbol] ?? symbol,
            exchange: 'B3',
            currency: 'BRL',
        }));
    }

    /**
     * Lista básica de ativos para popular o select do simulador.
     * Usa brapi ticker a ticker (respeita limite do plano) + fallback local.
     * Agora com cache em memória para reduzir chamadas.
     */
    async getBasicAssets(): Promise<MarketAsset[]> {
        // 1) Verifica cache
        if (
            this.basicAssetsCache &&
            this.basicAssetsCache.expiresAt > Date.now()
        ) {
            this.logger.log(
                '[MarketService] Retornando ativos do cache em memória',
            );
            return this.basicAssetsCache.data;
        }

        // 2) Se não tem cache válido, busca na brapi
        const tickers = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'WEGE3'];

        const fallbackAssets = this.getFallbackAssets();
        const fallbackMap = new Map<string, MarketAsset>(
            fallbackAssets.map((a) => [a.symbol, a]),
        );

        const assets: MarketAsset[] = [];

        for (const symbol of tickers) {
            try {
                const url = `${BRAPI_BASE_URL}/quote/${symbol}`;

                const params: Record<string, string> = {};
                if (BRAPI_API_KEY) {
                    params.token = BRAPI_API_KEY;
                }

                const response = await axios.get<BrapiQuoteResponse>(url, {
                    params,
                    timeout: 10000,
                    headers: {
                        'User-Agent':
                            'TradingStrategies-INF321/1.0 (+https://github.com/LucasMGcode)',
                        Accept: 'application/json,text/plain,*/*',
                    },
                });

                const result = response.data.results?.[0];

                if (!result) {
                    this.logger.warn(
                        `[MarketService] brapi não retornou dados para ${symbol}, usando fallback local para esse ativo`,
                    );
                    const fallback = fallbackMap.get(symbol);
                    if (fallback) {
                        assets.push(fallback);
                    }
                    continue;
                }

                const normalizedName = this.normalizeShortName(
                    result.symbol,
                    result.shortName ?? result.longName,
                );

                // 3) Aplica friendlyNames por símbolo
                const finalName =
                    this.friendlyNames[result.symbol] ?? normalizedName;

                assets.push({
                    symbol: result.symbol,
                    shortName: finalName,
                    exchange: 'B3',
                    currency: result.currency ?? 'BRL',
                });
            } catch (err) {
                this.logger.error(
                    `[MarketService] Erro ao obter dados para ${symbol} na brapi, usando fallback para esse ativo`,
                    err instanceof Error ? err.stack : String(err),
                );

                const fallback = fallbackMap.get(symbol);
                if (fallback) {
                    assets.push(fallback);
                }
            }
        }

        if (!assets.length) {
            this.logger.warn(
                '[MarketService] Nenhum ativo retornado da brapi, usando lista completa de fallback',
            );
            this.basicAssetsCache = {
                data: fallbackAssets,
                expiresAt: Date.now() + this.CACHE_TTL_MS,
            };
            return fallbackAssets;
        }

        this.logger.log(
            `[MarketService] ${assets.length} ativos obtidos (brapi + fallback) – cache atualizado`,
        );

        // 4) Atualiza cache
        this.basicAssetsCache = {
            data: assets,
            expiresAt: Date.now() + this.CACHE_TTL_MS,
        };

        return assets;
    }

    /**
     * Limpa e reconstrói o cache de ativos básicos.
     * Usado pelo endpoint de refresh.
     */
    async refreshBasicAssetsCache(): Promise<MarketAsset[]> {
        this.logger.log('[MarketService] Refresh manual do cache de ativos');
        this.basicAssetsCache = null;
        return this.getBasicAssets();
    }

    /**
     * (Opcional) método só para testes, se quiser limpar sem refazer
     */
    clearBasicAssetsCache() {
        this.logger.log('[MarketService] Cache de ativos limpo');
        this.basicAssetsCache = null;
    }

    /**
     * Futuro: histórico de cotações de um único ativo
     */
    async getQuoteHistory(
        symbol: string,
        range = '1mo',
        interval = '1d',
    ): Promise<BrapiQuoteResponse> {
        const url = `${BRAPI_BASE_URL}/quote/${symbol}`;

        const params: Record<string, string> = {
            range,
            interval,
        };

        if (BRAPI_API_KEY) {
            params.token = BRAPI_API_KEY;
        }

        const response = await axios.get<BrapiQuoteResponse>(url, {
            params,
            timeout: 10000,
            headers: {
                'User-Agent':
                    'TradingStrategies-INF321/1.0 (+https://github.com/LucasMGcode)',
                Accept: 'application/json,text/plain,*/*',
            },
        });

        return response.data;
    }
}