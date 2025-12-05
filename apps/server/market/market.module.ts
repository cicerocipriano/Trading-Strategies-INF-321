/**
 * Módulo que agrupa o controller e service de dados de mercado.
 * Responsável por encapsular toda a lógica de integração com provedores externos
 * (ex: Yahoo Finance) e expor endpoints REST para o front-end.
 */
import { Module } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';

@Module({
    controllers: [MarketController],
    providers: [MarketService],
    exports: [MarketService],
})
export class MarketModule { }
