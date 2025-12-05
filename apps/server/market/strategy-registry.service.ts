import { Injectable, Logger } from '@nestjs/common';
import { ISimulationStrategy } from './simulation-strategy.interface';
import { StrategyExecutionType } from './simulation-engine.types';
import { BuyHoldStrategy } from './strategies/buy-hold.strategy';
import { LongCallStrategy } from './strategies/long-call.strategy';

@Injectable()
export class StrategyRegistry {
    private readonly logger = new Logger(StrategyRegistry.name);
    private readonly strategies = new Map<StrategyExecutionType, ISimulationStrategy>();

    constructor(
        private readonly buyHoldStrategy: BuyHoldStrategy,
        private readonly longCallStrategy: LongCallStrategy,
    ) {
        this.register(this.buyHoldStrategy);
        this.register(this.longCallStrategy);
    }

    private register(strategy: ISimulationStrategy) {
        this.strategies.set(strategy.type, strategy);
    }

    getStrategy(type: StrategyExecutionType): ISimulationStrategy {
        const strategy = this.strategies.get(type);
        if (!strategy) {
            this.logger.warn(
                `[StrategyRegistry] Strategy não encontrada para type=${type}, usando BUY_HOLD_STOCK como fallback`,
            );
            return this.buyHoldStrategy;
        }
        return strategy;
    }
}