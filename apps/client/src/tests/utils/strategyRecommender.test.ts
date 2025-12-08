import { describe, it, expect } from 'vitest';
import {
    getExperienceLabel,
    inferUserRiskProfile,
    getSuggestedStrategies,
    type ExperienceLevel,
    type RiskLevel,
} from '@/utils/strategyRecommender';

describe('getExperienceLabel', () => {
    it('retorna rótulo correto para cada nível de experiência', () => {
        expect(getExperienceLabel('NOVICE')).toBe('Iniciante');
        expect(getExperienceLabel('INTERMEDIATE')).toBe('Intermediário');
        expect(getExperienceLabel('ADVANCED')).toBe('Avançado');
    });

    it('retorna "Não informado" quando nível é undefined', () => {
        const level: ExperienceLevel | undefined = undefined;
        expect(getExperienceLabel(level)).toBe('Não informado');
    });
});

describe('inferUserRiskProfile', () => {
    it('classifica como HIGH quando retorno médio é alto e win rate não é tão alto', () => {
        const risk = inferUserRiskProfile('50%', '25%');
        expect(risk).toBe<'HIGH'>('HIGH');
    });

    it('classifica como LOW quando win rate é alto e retorno médio é mais contido', () => {
        const risk = inferUserRiskProfile('70%', '10%');
        expect(risk).toBe<'LOW'>('LOW');
    });

    it('classifica como MEDIUM nos casos intermediários', () => {
        const risk = inferUserRiskProfile('60%', '18%');
        expect(risk).toBe<'MEDIUM'>('MEDIUM');
    });

    it('interpreta porcentagens com vírgula corretamente', () => {
        const risk = inferUserRiskProfile('40,0%', '21,5%');
        expect(risk).toBe<'HIGH'>('HIGH');
    });

    it('trata strings inválidas como 0% e cai no perfil MEDIUM', () => {
        const risk = inferUserRiskProfile('invalido', '5%');
        expect(risk).toBe<'MEDIUM'>('MEDIUM');
    });
});

describe('getSuggestedStrategies', () => {
    it('para NOVICE e risco MEDIUM recomenda apenas estratégias de nível iniciante compatíveis', () => {
        const experienceLevel: ExperienceLevel = 'NOVICE';
        const risk: RiskLevel = 'MEDIUM';

        const strategies = getSuggestedStrategies(experienceLevel, risk);

        const names = strategies.map((s) => s.name);

        expect(names).toContain('Long Call');
        expect(names).toContain('Long Put');
        expect(strategies.every((s) => s.minLevel === 'NOVICE')).toBe(true);
    });

    it('para INTERMEDIATE e risco LOW recomenda apenas estratégias com minLevel NOVICE/INTERMEDIATE e risco LOW', () => {
        const strategies = getSuggestedStrategies('INTERMEDIATE', 'LOW');

        const names = strategies.map((s) => s.name).sort();

        expect(names).toEqual([
            'Bear Put Spread',
            'Bull Call Spread',
            'Cash Secured Put',
            'Covered Call',
        ].sort());

        expect(
            strategies.every(
                (s) =>
                    (s.minLevel === 'NOVICE' || s.minLevel === 'INTERMEDIATE') &&
                    s.risk === 'LOW',
            ),
        ).toBe(true);
    });

    it('para ADVANCED e risco HIGH recomenda apenas estratégias de alto risco compatíveis', () => {
        const strategies = getSuggestedStrategies('ADVANCED', 'HIGH');

        expect(strategies).toHaveLength(1);
        expect(strategies[0].name).toBe('Synthetic Long Stock');
        expect(strategies[0].risk).toBe<'HIGH'>('HIGH');
        expect(strategies[0].minLevel).toBe<'ADVANCED'>('ADVANCED');
    });

    it('quando não há estratégia com o risco exato, retorna todas as permitidas pelo nível (fallback)', () => {
        const strategies = getSuggestedStrategies('NOVICE', 'LOW');

        const names = strategies.map((s) => s.name).sort();

        expect(names).toEqual(['Long Call', 'Long Put'].sort());
        expect(
            strategies.every((s) => s.minLevel === 'NOVICE'),
        ).toBe(true);
    });
});