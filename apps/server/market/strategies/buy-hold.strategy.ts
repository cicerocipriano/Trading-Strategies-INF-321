import { Injectable } from '@nestjs/common';
import {
    ISimulationStrategy,
} from '../simulation-strategy.interface';
import {
    SimulationBacktestResult,
    SimulationContext,
    StrategyExecutionType,
} from '../simulation-engine.types';

@Injectable()
export class BuyHoldStrategy implements ISimulationStrategy {
    readonly type: StrategyExecutionType = 'BUY_HOLD_STOCK';

    async run(context: SimulationContext): Promise<SimulationBacktestResult> {
        const { initialCapital, priceSeries } = context;

        if (!priceSeries.length || initialCapital <= 0) {
            return { totalReturn: 0, returnPercentage: 0, maxDrawdown: 0 };
        }

        const first = priceSeries[0].close;
        const last = priceSeries[priceSeries.length - 1].close;

        if (!first || !last) {
            return { totalReturn: 0, returnPercentage: 0, maxDrawdown: 0 };
        }

        const quantity = initialCapital / first;
        const finalCapital = quantity * last;
        const totalReturn = finalCapital - initialCapital;
        const returnPercentage = (totalReturn / initialCapital) * 100;

        const maxDrawdown = this.calculateMaxDrawdown(priceSeries) * 100;

        return { totalReturn, returnPercentage, maxDrawdown };
    }

    private calculateMaxDrawdown(series: { close: number }[]): number {
        let peak = series[0].close;
        let maxDd = 0;

        for (const point of series) {
            if (point.close > peak) {
                peak = point.close;
            }
            const dd = (point.close - peak) / peak;
            if (dd < maxDd) {
                maxDd = dd;
            }
        }
        return maxDd;
    }
}
