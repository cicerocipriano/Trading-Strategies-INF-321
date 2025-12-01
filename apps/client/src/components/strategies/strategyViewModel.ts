export interface StrategyDto {
    id: string;
    name: string;
    summary?: string | null;

    proficiencyLevel?: string | null;
    marketOutlook?: string | null;
    volatilityView?: string | null;

    riskProfile?: string | null;
    rewardProfile?: string | null;
    strategyType?: string | null;
}

export const proficiencyLabels: Record<string, string> = {
    NOVICE: 'Iniciante',
    INTERMEDIATE: 'Intermediário',
    ADVANCED: 'Avançado',
    EXPERT: 'Expert',
};

export const proficiencyBadge: Record<string, string> = {
    NOVICE: 'bg-emerald-500/10 text-emerald-300',
    INTERMEDIATE: 'bg-amber-500/10 text-amber-300',
    ADVANCED: 'bg-violet-500/10 text-violet-300',
    EXPERT: 'bg-fuchsia-500/10 text-fuchsia-300',
};

export const outlookLabels: Record<string, string> = {
    BULLISH: 'Bullish',
    BEARISH: 'Bearish',
    NEUTRAL: 'Neutral',
};

export const outlookBadge: Record<string, string> = {
    BULLISH: 'bg-emerald-500/10 text-emerald-300',
    BEARISH: 'bg-rose-500/10 text-rose-300',
    NEUTRAL: 'bg-slate-500/10 text-slate-200',
};

export const volatilityLabels: Record<string, string> = {
    HIGH: 'Alta',
    NEUTRAL: 'Neutra',
    LOW: 'Baixa',
};

export const riskProfileLabels: Record<string, string> = {
    CAPPED: 'Limitado',
    UNCAPPED: 'Ilimitado',
};

export const riskProfileBadge: Record<string, string> = {
    CAPPED: 'bg-amber-500/10 text-amber-200',
    UNCAPPED: 'bg-rose-500/10 text-rose-200',
};

export const rewardProfileLabels: Record<string, string> = {
    CAPPED: 'Limitado',
    UNCAPPED: 'Ilimitado',
};

export const strategyTypeLabels: Record<string, string> = {
    CAPITAL_GAIN: 'Ganho de capital',
    INCOME: 'Renda',
    PROTECTION: 'Proteção',
};

/**
 * Texto “pesquisável” de uma estratégia (para o search client-side).
 */
export function getStrategySearchText(strategy: StrategyDto): string {
    const profKey = strategy.proficiencyLevel ?? '';
    const outlookKey = strategy.marketOutlook ?? '';
    const volKey = strategy.volatilityView ?? '';
    const riskKey = strategy.riskProfile ?? '';
    const rewardKey = strategy.rewardProfile ?? '';
    const typeKey = strategy.strategyType ?? '';

    return [
        strategy.name,
        strategy.summary,
        strategy.strategyType,
        strategy.marketOutlook,
        strategy.proficiencyLevel,
        strategy.volatilityView,
        strategy.riskProfile,
        strategy.rewardProfile,
        proficiencyLabels[profKey],
        outlookLabels[outlookKey],
        volatilityLabels[volKey],
        riskProfileLabels[riskKey],
        rewardProfileLabels[rewardKey],
        strategyTypeLabels[typeKey],
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}