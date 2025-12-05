import { Injectable, Logger } from '@nestjs/common';
import {
    ISimulationStrategy,
} from '../simulation-strategy.interface';
import {
    SimulationBacktestResult,
    SimulationContext,
    StrategyExecutionType,
} from '../simulation-engine.types';

@Injectable()
export class LongCallStrategy implements ISimulationStrategy {
    readonly type: StrategyExecutionType = 'LONG_CALL';
    private readonly logger = new Logger(LongCallStrategy.name);

    async run(context: SimulationContext): Promise<SimulationBacktestResult> {
        const { initialCapital, priceSeries, legs, assetSymbol } = context;

        if (!priceSeries.length || initialCapital <= 0) {
            return { totalReturn: 0, returnPercentage: 0, maxDrawdown: 0 };
        }

        // 1) Procura uma CALL comprada (long call principal)
        const longCall = legs.find(
            (leg) => leg.instrumentType === 'CALL' && leg.action === 'BUY',
        );

        if (!longCall) {
            this.logger.warn(
                `[LongCallStrategy] Nenhuma leg CALL BUY encontrada para o ativo ${assetSymbol}. Retornando zero.`,
            );
            return { totalReturn: 0, returnPercentage: 0, maxDrawdown: 0 };
        }

        // 2) Strike
        let K = longCall.strikePrice;
        if (K == null) {
            // fallback simplificado: considera strike ≈ primeiro preço do subjacente
            K = priceSeries[0].close;
            this.logger.warn(
                `[LongCallStrategy] strikePrice ausente na leg. Usando preço inicial do subjacente (${K}) como strike aproximado.`,
            );
        }

        const premium = longCall.entryPrice;
        const qty = longCall.quantity;

        const lastPrice = priceSeries[priceSeries.length - 1].close;

        // 3) Payoff teórico por unidade
        const intrinsicValue = Math.max(lastPrice - K, 0);
        const payoffPerUnit = intrinsicValue - premium;

        const payoffTotal = payoffPerUnit * qty;

        const totalReturn = payoffTotal;
        const returnPercentage = (totalReturn / initialCapital) * 100;

        // 4) Max drawdown simplificado:
        // risco máximo da Long Call = prêmio pago (premium * qty)
        const maxPossibleLoss = premium * qty;
        const maxDrawdown = -(maxPossibleLoss / initialCapital) * 100;

        return {
            totalReturn,
            returnPercentage,
            maxDrawdown,
        };
    }
}