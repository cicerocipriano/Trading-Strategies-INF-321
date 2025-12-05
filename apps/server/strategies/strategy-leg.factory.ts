import { Injectable } from '@nestjs/common';
import { InsertSimulationLeg, SelectStrategyLeg } from '../db';
import { MoneynessType } from './strategy-leg.types';

/**
 * Parâmetros necessários para instanciar as pernas de simulação
 * a partir dos strategy_legs.
 */
interface InstantiateLegParams {
    templates: SelectStrategyLeg[];
    simulation: {
        id: string;
        initialCapital: number;
        startDate: Date;
        endDate: Date;
        assetSymbol: string;
    };
    underlyingPriceAtStart: number;
}

@Injectable()
export class StrategyLegFactory {
    instantiateLegs(params: InstantiateLegParams): InsertSimulationLeg[] {
        const { templates, simulation, underlyingPriceAtStart } = params;

        return templates.map((tpl): InsertSimulationLeg => {
            const isOption = tpl.instrumentType === 'CALL' || tpl.instrumentType === 'PUT';
            const premiumPct = isOption ? 0.1 : 1.0;
            const entryPriceNumber =  underlyingPriceAtStart * premiumPct;
            const quantity = tpl.quantityRatio ?? 1;
            const strikeNumber = isOption
                ? this.calculateStrikeFromRelation(
                    underlyingPriceAtStart,
                    tpl.strikeRelation as MoneynessType,
                    tpl.instrumentType,
                )
                : null;

            return {
                simulationId: simulation.id,
                instrumentType: tpl.instrumentType,
                action: tpl.action,
                quantity,
                entryPrice: entryPriceNumber.toFixed(2),
                entryDate: simulation.startDate,
                strikePrice:
                    strikeNumber !== null
                        ? strikeNumber.toFixed(2)
                        : null,
                expiryDate: isOption ? simulation.endDate : null,
                exitPrice: null,
                exitDate: null,
                profitLoss: null,
            };
        });
    }

    /**
     * Dado o preço do subjacente e a relação de strike (ATM/ITM/OTM),
     * devolve um strike aproximado.
     *
     * Para CALL:
     *   - ITM → strike abaixo do preço
     *   - OTM → strike acima do preço
     *
     * Para PUT (já preparado para o futuro):
     *   - ITM → strike acima do preço
     *   - OTM → strike abaixo do preço
     */
    private calculateStrikeFromRelation(
        underlying: number,
        relation: MoneynessType,
        instrumentType: 'CALL' | 'PUT' | 'STOCK',
    ): number {
        const offset = 0.05;

        switch (relation) {
            case 'ITM':
                if (instrumentType === 'PUT') {
                    return underlying * (1 + offset);
                }
                return underlying * (1 - offset);

            case 'OTM':
                if (instrumentType === 'PUT') {
                    return underlying * (1 - offset);
                }
                return underlying * (1 + offset);

            case 'ATM':
            default:
                return underlying;
        }
    }
}