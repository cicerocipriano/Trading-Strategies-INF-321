import { InstrumentType, LegAction } from '../strategies/strategy-leg.types';

export interface SimulationLeg {
    id: string;
    simulationId: string;

    instrumentType: InstrumentType; // 'CALL' | 'PUT' | 'STOCK'
    action: LegAction;              // 'BUY' | 'SELL'

    quantity: number;        // número de ações ou unidades (contratos * contractSize)
    entryPrice: string;      // prêmio da opção ou preço do ativo (decimal string)
    exitPrice?: string;

    entryDate: Date;
    exitDate?: Date;

    strikePrice?: string;    // para opções
    expiryDate?: Date;       // para opções

    profitLoss?: string;     // opcional, se quiser registrar na tabela
}