import { StrategyExecutionType } from '../market/simulation-engine.types';

/**
 * Faz o mapeamento entre o nome da estratégia (tabela strategies.name)
 * e o tipo de execução utilizado pelo motor de simulação.
 *
 * Por enquanto:
 *  - "Long Call" → LONG_CALL (usa payoff específico)
 *  - qualquer outra → BUY_HOLD_STOCK (fallback genérico)
 */
export function mapExecutionTypeFromStrategyName(
    name?: string | null,
): StrategyExecutionType {
    if (!name) {
        return 'BUY_HOLD_STOCK';
    }

    const normalized = name.trim().toLowerCase();

    if (normalized === 'long call') {
        return 'LONG_CALL';
    }
    return 'BUY_HOLD_STOCK';
}
