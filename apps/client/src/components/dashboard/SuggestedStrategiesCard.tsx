import { Link } from 'react-router-dom';
import { LineChart } from 'lucide-react';
import {
    getExperienceLabel,
    inferUserRiskProfile,
    getSuggestedStrategies,
    type ExperienceLevel,
} from '@/utils/strategyRecommender';

interface SuggestedStrategiesCardProps {
    readonly experienceLevel: ExperienceLevel;
    readonly winRate: string | undefined;
    readonly avgReturn: string | undefined;
}

export function SuggestedStrategiesCard({
    experienceLevel,
    winRate,
    avgReturn,
}: SuggestedStrategiesCardProps) {
    const experienceLabel = getExperienceLabel(experienceLevel);
    const userRiskProfile = inferUserRiskProfile(winRate, avgReturn);
    const suggestedStrategies = getSuggestedStrategies(experienceLevel, userRiskProfile);

    let riskLabel = 'agressivo';
    if (userRiskProfile === 'LOW') {
        riskLabel = 'conservador';
    } else if (userRiskProfile === 'MEDIUM') {
        riskLabel = 'moderado';
    }

    const riskChipLabel = (risk: (typeof userRiskProfile)) =>
        risk === 'LOW'
            ? 'Risco baixo'
            : risk === 'MEDIUM'
                ? 'Risco moderado'
                : 'Risco alto';

    return (
        <div className="ts-glass-surface ts-glass-hover-lift rounded-xl p-5 space-y-4">
            <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <LineChart className="w-4 h-4" />
                    Estratégias sugeridas
                </h2>
                <p className="text-sm text-muted-foreground">
                    Baseadas no seu nível de experiência ({experienceLabel}) e no seu perfil de risco atual (
                    {riskLabel}).
                </p>
            </div>

            <div className="space-y-3">
                {suggestedStrategies.map((strategy) => (
                    <div
                        key={strategy.name}
                        className="rounded-lg border border-border bg-background px-4 py-3 space-y-2"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{strategy.name}</p>
                            <span className="text-xs text-muted-foreground">{strategy.bias}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{strategy.description}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                                {getExperienceLabel(strategy.minLevel)}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                                {riskChipLabel(strategy.risk)}
                            </span>
                            {strategy.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-1">
                <Link
                    to="/strategies"
                    className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition"
                >
                    Explorar todas as estratégias
                </Link>
            </div>
        </div>
    );
}
