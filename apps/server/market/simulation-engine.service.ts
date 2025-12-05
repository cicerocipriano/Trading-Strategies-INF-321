import { Injectable, Logger } from '@nestjs/common';
import {
    MarketService,
    BrapiHistoricalPrice,
} from './market.service';
import { SelectSimulation, SelectSimulationLeg } from '../db';
import {
    PricePoint,
    SimulationBacktestResult,
    SimulationContext,
    StrategyExecutionType,
} from './simulation-engine.types';
import { StrategyRegistry } from './strategy-registry.service';

@Injectable()
export class SimulationEngineService {
    private readonly logger = new Logger(SimulationEngineService.name);

    constructor(
        private readonly marketService: MarketService,
        private readonly strategyRegistry: StrategyRegistry,
    ) { }

    async runBacktest(
        simulation: SelectSimulation & {
            strategyExecutionType: StrategyExecutionType;
            legs: SelectSimulationLeg[];
        },
    ): Promise<SimulationBacktestResult> {
        const startDate = this.normalizeDate(simulation.startDate);
        const endDate = this.normalizeDate(simulation.endDate);

        if (!startDate || !endDate || endDate <= startDate) {
            this.logger.warn(
                `[SimulationEngine] Datas inválidas para simulação ${simulation.id}: start=${simulation.startDate} end=${simulation.endDate}`,
            );
            return { totalReturn: 0, returnPercentage: 0, maxDrawdown: 0 };
        }

        const initialCapital = Number(
            simulation.initialCapital?.toString() ?? '0',
        );

        if (!initialCapital || !Number.isFinite(initialCapital) || initialCapital <= 0) {
            this.logger.warn(
                `[SimulationEngine] Capital inicial inválido para simulação ${simulation.id}: ${simulation.initialCapital}`,
            );
            return { totalReturn: 0, returnPercentage: 0, maxDrawdown: 0 };
        }

        try {
            const priceSeries = await this.loadPriceSeries(
                simulation.assetSymbol,
                startDate,
                endDate,
            );

            if (priceSeries.length < 2) {
                this.logger.warn(
                    `[SimulationEngine] Série histórica insuficiente para ${simulation.assetSymbol} no período. Usando retorno zero.`,
                );
                return { totalReturn: 0, returnPercentage: 0, maxDrawdown: 0 };
            }

            const context: SimulationContext = {
                id: simulation.id,
                userId: simulation.userId,
                strategyExecutionType: simulation.strategyExecutionType,
                assetSymbol: simulation.assetSymbol,
                startDate,
                endDate,
                initialCapital,
                legs: simulation.legs.map((leg) => ({
                    id: leg.id,
                    instrumentType: leg.instrumentType as 'CALL' | 'PUT' | 'STOCK',
                    action: leg.action as 'BUY' | 'SELL',
                    quantity: Number(leg.quantity),
                    entryPrice: Number(leg.entryPrice),
                    strikePrice: leg.strikePrice
                        ? Number(leg.strikePrice)
                        : undefined,
                    expiryDate: leg.expiryDate ?? undefined,
                })),
                priceSeries,
            };

            const strategy = this.strategyRegistry.getStrategy(
                simulation.strategyExecutionType,
            );

            const result = await strategy.run(context);

            this.logger.log(
                `[SimulationEngine] Backtest concluído para simulação ${simulation.id} com strategy=${simulation.strategyExecutionType}: ` +
                `retorno=${result.totalReturn.toFixed(
                    2,
                )}, roi=${result.returnPercentage.toFixed(
                    2,
                )}%, maxDD=${result.maxDrawdown.toFixed(2)}%`,
            );

            return result;
        } catch (err) {
            this.logger.error(
                `[SimulationEngine] Erro ao executar backtest para simulação ${simulation.id}`,
                err instanceof Error ? err.stack : String(err),
            );
            return { totalReturn: 0, returnPercentage: 0, maxDrawdown: 0 };
        }
    }

    private normalizeDate(value: unknown): Date | null {
        if (value instanceof Date) return value;
        if (typeof value === 'string') {
            const d = new Date(value);
            return Number.isNaN(d.getTime()) ? null : d;
        }
        return null;
    }

    private async loadPriceSeries(
        symbol: string,
        startDate: Date,
        endDate: Date,
    ): Promise<PricePoint[]> {
        const range = this.chooseRange(startDate);

        const quoteResponse = await this.marketService.getQuoteHistory(
            symbol,
            range,
            '1d',
        );

        const firstResult = quoteResponse.results?.[0];
        const raw: BrapiHistoricalPrice[] =
            firstResult?.historicalDataPrice ?? [];

        const series: PricePoint[] = raw
            .map((bar: BrapiHistoricalPrice): PricePoint | null => {
                const timestampSeconds = bar.date ?? 0;
                const d = new Date(timestampSeconds * 1000);
                const close = bar.close ?? bar.open ?? null;

                if (close == null) {
                    return null;
                }

                return { date: d, close: Number(close) };
            })
            .filter(
                (p: PricePoint | null): p is PricePoint =>
                    !!p && !Number.isNaN(p.close),
            )
            .filter(
                (p: PricePoint) =>
                    p.date >= startDate && p.date <= endDate,
            )
            .sort(
                (a: PricePoint, b: PricePoint) =>
                    a.date.getTime() - b.date.getTime(),
            );

        return series;
    }

    private chooseRange(start: Date): string {
        const now = new Date();
        const MS_PER_DAY = 1000 * 60 * 60 * 24;
        const daysBack = Math.max(
            0,
            (now.getTime() - start.getTime()) / MS_PER_DAY,
        );

        if (daysBack <= 31) return '1mo';
        if (daysBack <= 93) return '3mo';
        if (daysBack <= 186) return '6mo';
        if (daysBack <= 365) return '1y';
        if (daysBack <= 365 * 2) return '2y';
        if (daysBack <= 365 * 5) return '5y';
        return 'max';
    }
}