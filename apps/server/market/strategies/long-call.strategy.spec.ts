import { LongCallStrategy } from './long-call.strategy';
import type { SimulationContext } from '../simulation-engine.types';

describe('LongCallStrategy', () => {
    const strategy = new LongCallStrategy();

    const buildContext = (
        overrides: Partial<SimulationContext> = {},
    ): SimulationContext => ({
        id: 'sim-1',
        userId: 'user-1',
        assetSymbol: 'PETR4',
        strategyExecutionType: 'LONG_CALL',
        initialCapital: 1_000,
        priceSeries: [
            { date: new Date('2024-01-01'), close: 10 },
            { date: new Date('2024-01-05'), close: 15 },
        ],
        legs: [
            {
                id: 'leg-1',
                instrumentType: 'CALL',
                action: 'BUY',
                quantity: 1,
                entryPrice: 2,
                strikePrice: 11,
                expiryDate: new Date('2024-02-01'),
            },
        ],
        ...overrides,
    });

    it('retorna zeros quando não há priceSeries ou capital inválido', async () => {
        const resultEmpty = await strategy.run(
            buildContext({ priceSeries: [], initialCapital: 1000 }),
        );
        expect(resultEmpty).toEqual({
            totalReturn: 0,
            returnPercentage: 0,
            maxDrawdown: 0,
        });

        const resultNoCapital = await strategy.run(
            buildContext({ initialCapital: 0 }),
        );
        expect(resultNoCapital).toEqual({
            totalReturn: 0,
            returnPercentage: 0,
            maxDrawdown: 0,
        });
    });

    it('retorna zeros e loga warn quando não há CALL BUY', async () => {
        const warnSpy = jest.spyOn((strategy as any).logger, 'warn');

        const result = await strategy.run(
            buildContext({ legs: [{ ...buildContext().legs[0], action: 'SELL' }] }),
        );

        expect(result).toEqual({
            totalReturn: 0,
            returnPercentage: 0,
            maxDrawdown: 0,
        });
        expect(warnSpy).toHaveBeenCalled();
    });

    it('calcula payoff com strike informado', async () => {
        const context = buildContext({
            initialCapital: 1000,
            priceSeries: [
                { date: new Date('2024-01-01'), close: 10 },
                { date: new Date('2024-01-10'), close: 15 },
            ],
            legs: [
                {
                    id: 'leg-1',
                    instrumentType: 'CALL',
                    action: 'BUY',
                    quantity: 2,
                    entryPrice: 2,
                    strikePrice: 11,
                    expiryDate: new Date('2024-02-01'),
                },
            ],
        });

        const result = await strategy.run(context);

        // payoff por unidade = max(15-11,0) - 2 = 2 => total = 4
        expect(result.totalReturn).toBeCloseTo(4);
        expect(result.returnPercentage).toBeCloseTo(0.4);
        // drawdown máximo = -premiumTotal / capital inicial
        expect(result.maxDrawdown).toBeCloseTo(-0.4);
    });

    it('usa strike inicial do ativo quando leg não define strike e loga warn', async () => {
        const warnSpy = jest.spyOn((strategy as any).logger, 'warn');

        const context = buildContext({
            legs: [
                {
                    id: 'leg-1',
                    instrumentType: 'CALL',
                    action: 'BUY',
                    quantity: 1,
                    entryPrice: 1.5,
                    strikePrice: undefined,
                    expiryDate: new Date('2024-02-01'),
                },
            ],
            priceSeries: [
                { date: new Date('2024-01-01'), close: 20 },
                { date: new Date('2024-01-10'), close: 25 },
            ],
            initialCapital: 5000,
        });

        const result = await strategy.run(context);

        // Strike assume primeiro close (=20); payoff por unidade = 25-20-1.5 = 3.5
        expect(result.totalReturn).toBeCloseTo(3.5);
        expect(result.returnPercentage).toBeCloseTo((3.5 / 5000) * 100);
        expect(result.maxDrawdown).toBeCloseTo(-(1.5 / 5000) * 100);
        expect(warnSpy).toHaveBeenCalled();
    });
});
