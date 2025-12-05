import { mapExecutionTypeFromStrategyName } from './strategy-execution.mapper';

describe('mapExecutionTypeFromStrategyName', () => {
    it('deve mapear exatamente "Long Call" para LONG_CALL', () => {
        const result = mapExecutionTypeFromStrategyName('Long Call');
        expect(result).toBe('LONG_CALL');
    });

    it('deve ser tolerante a variações de maiúsculas/minúsculas e espaços', () => {
        expect(mapExecutionTypeFromStrategyName('long call')).toBe('LONG_CALL');
        expect(mapExecutionTypeFromStrategyName(' LONG CALL ')).toBe('LONG_CALL');
        expect(mapExecutionTypeFromStrategyName('lOnG cAlL')).toBe('LONG_CALL');
    });

    it('deve usar BUY_HOLD_STOCK como fallback para outras estratégias conhecidas', () => {
        expect(mapExecutionTypeFromStrategyName('Covered Call')).toBe('BUY_HOLD_STOCK');
        expect(mapExecutionTypeFromStrategyName('Bull Call Spread')).toBe('BUY_HOLD_STOCK');
        expect(mapExecutionTypeFromStrategyName('Straddle (Long Straddle)')).toBe(
            'BUY_HOLD_STOCK',
        );
        expect(mapExecutionTypeFromStrategyName('Synthetic Long Stock')).toBe(
            'BUY_HOLD_STOCK',
        );
    });

    it('deve usar BUY_HOLD_STOCK para nomes completamente desconhecidos', () => {
        expect(mapExecutionTypeFromStrategyName('QUALQUER_COISA_AQUI')).toBe(
            'BUY_HOLD_STOCK',
        );
        expect(mapExecutionTypeFromStrategyName('')).toBe('BUY_HOLD_STOCK');
    });

    it('deve usar BUY_HOLD_STOCK quando o nome for undefined ou null', () => {
        expect(mapExecutionTypeFromStrategyName(undefined)).toBe('BUY_HOLD_STOCK');
        expect(mapExecutionTypeFromStrategyName(null)).toBe('BUY_HOLD_STOCK');
    });
});
