// src/utils/strategyRecommender.ts

export type ExperienceLevel = 'NOVICE' | 'INTERMEDIATE' | 'ADVANCED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SuggestedStrategy {
    name: string;
    bias: string;
    description: string;
    minLevel: ExperienceLevel;
    risk: RiskLevel;
    tags: string[];
}

const STRATEGY_RECOMMENDATIONS: SuggestedStrategy[] = [
    {
        name: 'Long Call',
        bias: 'Altista',
        description: 'Compra de uma opção de compra. Expectativa de alta do ativo.',
        minLevel: 'NOVICE',
        risk: 'MEDIUM',
        tags: ['Alta', 'Direcional', 'Risco limitado'],
    },
    {
        name: 'Long Put',
        bias: 'Baixista',
        description: 'Compra de uma opção de venda. Expectativa de queda do ativo.',
        minLevel: 'NOVICE',
        risk: 'MEDIUM',
        tags: ['Baixa', 'Direcional', 'Proteção'],
    },
    {
        name: 'Covered Call',
        bias: 'Neutro / levemente altista',
        description: 'Venda de uma opção de compra contra ações que você já possui.',
        minLevel: 'INTERMEDIATE',
        risk: 'LOW',
        tags: ['Renda', 'Neutro', 'Risco limitado'],
    },
    {
        name: 'Cash Secured Put',
        bias: 'Altista',
        description: 'Venda de uma opção de venda com o capital para comprar o ativo reservado.',
        minLevel: 'INTERMEDIATE',
        risk: 'LOW',
        tags: ['Renda', 'Alta', 'Entrada planejada'],
    },
    {
        name: 'Bull Call Spread',
        bias: 'Altista moderado',
        description: 'Compra de uma Call de strike mais baixo e venda de uma Call de strike mais alto.',
        minLevel: 'INTERMEDIATE',
        risk: 'LOW',
        tags: ['Alta moderada', 'Risco/retorno limitados'],
    },
    {
        name: 'Bear Put Spread',
        bias: 'Baixista moderado',
        description: 'Compra de uma Put de strike mais alto e venda de uma Put de strike mais baixo.',
        minLevel: 'INTERMEDIATE',
        risk: 'LOW',
        tags: ['Baixa moderada', 'Risco/retorno limitados'],
    },
    {
        name: 'Straddle (Long Straddle)',
        bias: 'Alta volatilidade',
        description: 'Compra de uma Call e uma Put com o mesmo strike e vencimento.',
        minLevel: 'INTERMEDIATE',
        risk: 'MEDIUM',
        tags: ['Volatilidade', 'Neutro direcional'],
    },
    {
        name: 'Strangle (Long Strangle)',
        bias: 'Alta volatilidade',
        description: 'Compra de uma Call OTM e uma Put OTM com o mesmo vencimento.',
        minLevel: 'INTERMEDIATE',
        risk: 'MEDIUM',
        tags: ['Volatilidade', 'Neutro direcional'],
    },
    {
        name: 'Long Call Butterfly',
        bias: 'Neutro',
        description: 'Compra de uma Call de strike baixo, venda de duas Calls ATM e compra de uma Call de strike alto.',
        minLevel: 'ADVANCED',
        risk: 'LOW',
        tags: ['Neutro', 'Estrutura de múltiplas pernas'],
    },
    {
        name: 'Long Iron Condor',
        bias: 'Neutro',
        description: 'Compra de um Bear Call Spread e um Bull Put Spread.',
        minLevel: 'ADVANCED',
        risk: 'LOW',
        tags: ['Neutro', 'Income', 'Múltiplas pernas'],
    },
    {
        name: 'Synthetic Long Stock',
        bias: 'Altista',
        description: 'Compra de uma Call e venda de uma Put com o mesmo strike e vencimento.',
        minLevel: 'ADVANCED',
        risk: 'HIGH',
        tags: ['Alta', 'Alavancagem', 'Sintético'],
    },
    {
        name: 'Collar',
        bias: 'Neutro / proteção',
        description: 'Compra do ativo, venda de uma Call OTM e compra de uma Put OTM.',
        minLevel: 'ADVANCED',
        risk: 'LOW',
        tags: ['Proteção', 'Risco limitado', 'Trava de ganhos'],
    },
];

function parsePercent(value: string | number | undefined | null): number | null {
    if (value == null) return null;
    if (typeof value === 'number') return value;
    const normalized = value.replace('%', '').replace(',', '.').trim();
    const n = Number(normalized);
    return Number.isNaN(n) ? null : n;
}

function getLevelRank(level: ExperienceLevel): number {
    switch (level) {
        case 'NOVICE':
            return 1;
        case 'INTERMEDIATE':
            return 2;
        case 'ADVANCED':
            return 3;
    }
}

export function getExperienceLabel(level: ExperienceLevel | undefined): string {
    switch (level) {
        case 'NOVICE':
            return 'Iniciante';
        case 'INTERMEDIATE':
            return 'Intermediário';
        case 'ADVANCED':
            return 'Avançado';
        default:
            return 'Não informado';
    }
}

// Deduz o perfil de risco a partir das estatísticas do usuário
export function inferUserRiskProfile(
    winRateStr: string | undefined,
    avgReturnStr: string | undefined,
): RiskLevel {
    const winRate = parsePercent(winRateStr ?? '0') ?? 0;
    const avgReturn = parsePercent(avgReturnStr ?? '0') ?? 0;

    // Regras simples:
    // - Agressivo: retorno médio >= 20% com taxa de acerto não tão alta
    if (avgReturn >= 20 && winRate < 55) {
        return 'HIGH';
    }

    // - Conservador: acerto muito alto com retorno mais contido
    if (winRate >= 65 && avgReturn < 15) {
        return 'LOW';
    }

    // - Caso intermediário
    return 'MEDIUM';
}

// Escolhe estratégias levando em conta nível + risco
export function getSuggestedStrategies(
    experienceLevel: ExperienceLevel,
    userRisk: RiskLevel,
): SuggestedStrategy[] {
    const userLevelRank = getLevelRank(experienceLevel);

    // 1. filtra por nível
    const allowedByLevel = STRATEGY_RECOMMENDATIONS.filter(
        (s) => getLevelRank(s.minLevel) <= userLevelRank,
    );

    // 2. tenta combinar com o risco inferido
    const matchingRisk = allowedByLevel.filter((s) => s.risk === userRisk);

    if (matchingRisk.length > 0) {
        return matchingRisk;
    }

    // 3. fallback: se nenhuma bater o risco exato, mostra todas pelo nível
    return allowedByLevel;
}
