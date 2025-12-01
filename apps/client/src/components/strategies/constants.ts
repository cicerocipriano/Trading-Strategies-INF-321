export const PAGE_SIZE = 6;

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

export interface FilterState {
    proficiencyLevel: string;
    marketOutlook: string;
    volatilityView: string;
    riskProfile: string;
    rewardProfile: string;
    strategyType: string;
}
