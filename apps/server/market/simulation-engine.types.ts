export type StrategyExecutionType =
    | 'BUY_HOLD_STOCK'
    | 'LONG_CALL';

export interface PricePoint {
    date: Date;
    close: number;
}

export interface SimulationLegContext {
    id: string;
    instrumentType: 'CALL' | 'PUT' | 'STOCK';
    action: 'BUY' | 'SELL';
    quantity: number;
    entryPrice: number;
    strikePrice?: number;
    expiryDate?: Date;
}

export interface SimulationContext {
    id: string;
    userId: string;
    strategyExecutionType: StrategyExecutionType;
    assetSymbol: string;
    startDate: Date;
    endDate: Date;
    initialCapital: number;
    legs: SimulationLegContext[];
    priceSeries: PricePoint[];
}

export interface SimulationBacktestResult {
    totalReturn: number;
    returnPercentage: number;
    maxDrawdown: number;
}
