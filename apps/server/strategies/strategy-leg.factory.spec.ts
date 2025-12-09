import { StrategyLegFactory } from './strategy-leg.factory';
import type { SelectStrategyLeg } from '../db';

describe('StrategyLegFactory', () => {
    const factory = new StrategyLegFactory();

    const baseSimulation = {
        id: 'sim-1',
        initialCapital: 10_000,
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        endDate: new Date('2024-02-01T00:00:00.000Z'),
        assetSymbol: 'PETR4',
    };

    const makeTemplate = (
        overrides: Partial<SelectStrategyLeg>,
    ): SelectStrategyLeg =>
        ({
            id: 'leg-1',
            strategyId: 'strategy-1',
            action: 'BUY',
            instrumentType: 'CALL',
            quantityRatio: 2,
            strikeRelation: 'ITM',
            ...overrides,
        }) as SelectStrategyLeg;

    it('instancia leg de CALL calculando strike ITM, premium e datas', () => {
        const legs = factory.instantiateLegs({
            templates: [makeTemplate({ instrumentType: 'CALL', strikeRelation: 'ITM' })],
            simulation: baseSimulation,
            underlyingPriceAtStart: 100,
        });

        expect(legs).toHaveLength(1);
        const leg = legs[0];

        expect(leg.simulationId).toBe(baseSimulation.id);
        expect(leg.instrumentType).toBe('CALL');
        expect(leg.action).toBe('BUY');
        expect(leg.quantity).toBe(2);
        expect(leg.entryPrice).toBe('10.00');
        expect(leg.entryDate).toEqual(baseSimulation.startDate);
        expect(leg.strikePrice).toBe('95.00');
        expect(leg.expiryDate).toEqual(baseSimulation.endDate);
    });

    it('instancia leg de PUT calculando strike OTM invertido (5% abaixo) e premium', () => {
        const legs = factory.instantiateLegs({
            templates: [makeTemplate({ instrumentType: 'PUT', strikeRelation: 'OTM' })],
            simulation: baseSimulation,
            underlyingPriceAtStart: 200,
        });

        const leg = legs[0];

        expect(leg.instrumentType).toBe('PUT');
        expect(leg.entryPrice).toBe('20.00');
        expect(leg.strikePrice).toBe('190.00');
        expect(leg.expiryDate).toEqual(baseSimulation.endDate);
    });

    it('instancia leg de STOCK sem strike/expiry e quantity default = 1', () => {
        const legs = factory.instantiateLegs({
            templates: [makeTemplate({ instrumentType: 'STOCK', quantityRatio: null as unknown as number })],
            simulation: baseSimulation,
            underlyingPriceAtStart: 50,
        });

        const leg = legs[0];

        expect(leg.instrumentType).toBe('STOCK');
        expect(leg.entryPrice).toBe('50.00');
        expect(leg.quantity).toBe(1);
        expect(leg.strikePrice).toBeNull();
        expect(leg.expiryDate).toBeNull();
    });
});
