/**
 * Controller responsável por expor endpoints REST relacionados a dados de mercado.
 * Exemplo: lista de ativos, cotações, histórico de preços, etc.
 */
import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { MarketService, MarketAsset } from './market.service';

/**
 * Controller para dados de mercado.
 * Rota base: /api/market
 */
@Controller('market')
export class MarketController {
    constructor(private readonly marketService: MarketService) { }

    /**
     * GET /api/market/assets
     * Obtém uma lista básica de ativos para popular selects no front-end.
     * 
     * Resposta:
     * [
     *   {
     *     symbol: string,     // "PETR4.SA"
     *     shortName: string,  // "Petrobras"
     *     exchange: string,
     *     currency: string    // "BRL"
     *   },
     *   ...
     * ]
     */
    @Get('assets')
    async getAssets(): Promise<MarketAsset[]> {
        return this.marketService.getBasicAssets();
    }

    /**
     * Endpoint manual para forçar refresh do cache de ativos.
     * TODO: Em produção, proteger com auth/role (ADMIN).
     */
    @Post('assets/cache/refresh')
    @HttpCode(HttpStatus.OK)
    async refreshAssetsCache() {
        const data = await this.marketService.refreshBasicAssetsCache();

        return {
            refreshedAt: new Date().toISOString(),
            count: data.length,
            data,
        };
    }
}
