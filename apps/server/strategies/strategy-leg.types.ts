export type InstrumentType = 'CALL' | 'PUT' | 'STOCK';
export type LegAction = 'BUY' | 'SELL';

export type AllocationType =
    | 'PERCENT_OF_CAPITAL'
    | 'FIXED_CONTRACTS';

export type MoneynessType = 'ATM' | 'ITM' | 'OTM';

export type ExpiryMode =
    | 'MATCH_SIMULATION_END'
    | 'NEXT_MONTH'
    | 'FIXED_DAYS_FROM_START';

export interface StrategyLegTemplate {
    id: string;
    strategyId: string;
    order: number;

    instrumentType: InstrumentType;
    action: LegAction;

    quantityRatio: number;
    strikeRelation: 'ATM' | 'ITM' | 'OTM';

    allocationType: AllocationType;
    allocationValue: string;

    moneyness?: MoneynessType;
    moneynessOffsetPct?: number;

    expiryMode?: ExpiryMode;
    expiryDaysOffset?: number;

    premiumPctOfUnderlying?: number;
    contractSize?: number;
}