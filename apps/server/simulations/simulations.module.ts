/**
 * Módulo que agrupa o controller e service de simulações.
 * Responsável por encapsular toda a lógica de simulações.
 */
import { Module } from '@nestjs/common';
import { SimulationsController } from './simulations.controller';
import { SimulationsService } from './simulations.service';
import { MarketModule } from '../market/market.module';
import { StrategyLegFactory } from '../strategies/strategy-leg.factory';

@Module({
    imports: [MarketModule],
    controllers: [SimulationsController],
    providers: [
        SimulationsService,
        StrategyLegFactory,
    ],
    exports: [SimulationsService],
})
export class SimulationsModule { }