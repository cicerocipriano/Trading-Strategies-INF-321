/**
 * Módulo que agrupa o controller e service de dados de mercado.
 * Responsável por encapsular toda a lógica de integração com provedores externos
 * (ex: Yahoo Finance) e expor endpoints REST para o front-end.
 */
import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { SimulationEngineService } from './simulation-engine.service';
import { StrategyRegistry } from './strategy-registry.service';
import { BuyHoldStrategy } from './strategies/buy-hold.strategy';
import { LongCallStrategy } from './strategies/long-call.strategy';

@Module({
    imports: [],
    controllers: [MarketController],
    providers: [
        MarketService,
        SimulationEngineService,
        StrategyRegistry,
        BuyHoldStrategy,
        LongCallStrategy,
    ],
    exports: [
        MarketService,
        SimulationEngineService,
    ],
})
export class MarketModule { }