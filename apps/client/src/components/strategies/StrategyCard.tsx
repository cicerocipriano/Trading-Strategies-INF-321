import { useNavigate } from 'react-router-dom';
import {
    proficiencyBadge,
    proficiencyLabels,
    outlookBadge,
    outlookLabels,
    riskProfileBadge,
    riskProfileLabels,
    volatilityLabels,
    rewardProfileLabels,
    strategyTypeLabels,
} from '@/components/strategies/constants';

interface StrategyCardProps {
    strategy: {
        readonly id: string | number;
        readonly name: string;
        readonly summary?: string;
        readonly proficiencyLevel?: string | null;
        readonly marketOutlook?: string | null;
        readonly volatilityView?: string | null;
        readonly riskProfile?: string | null;
        readonly rewardProfile?: string | null;
        readonly strategyType?: string | null;
    };
}

export function StrategyCard({ strategy }: StrategyCardProps) {
    const navigate = useNavigate();

    const profKey = strategy.proficiencyLevel ?? '';
    const outlookKey = strategy.marketOutlook ?? '';
    const riskKey = strategy.riskProfile ?? '';
    const volKey = strategy.volatilityView ?? '';
    const rewardKey = strategy.rewardProfile ?? '';
    const typeKey = strategy.strategyType ?? '';

    const handleViewDetails = () => {
        navigate(`/strategies/${strategy.id}`);
    };

    const handleSimulate = () => {
        navigate('/simulator', {
            state: {
                strategyId: String(strategy.id),
                strategyName: strategy.name,
            },
        });
    };

    return (
        <div
            className="
                ts-glass-surface ts-glass-hover-lift
                rounded-2xl
                p-6
                flex flex-col
            "
        >
            {/* Título + resumo */}
            <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{strategy.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {strategy.summary}
                </p>

                {/* Chips principais */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {profKey && (
                        <span
                            className={[
                                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                                proficiencyBadge[profKey] ??
                                'bg-slate-500/10 text-slate-200',
                            ].join(' ')}
                        >
                            {proficiencyLabels[profKey] ?? profKey}
                        </span>
                    )}

                    {outlookKey && (
                        <span
                            className={[
                                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                                outlookBadge[outlookKey] ??
                                'bg-slate-500/10 text-slate-200',
                            ].join(' ')}
                        >
                            {outlookLabels[outlookKey] ?? outlookKey}
                        </span>
                    )}

                    {volKey && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-200">
                            Volatilidade {volatilityLabels[volKey] ?? volKey}
                        </span>
                    )}

                    {riskKey && (
                        <span
                            className={[
                                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                                riskProfileBadge[riskKey] ??
                                'bg-amber-500/10 text-amber-200',
                            ].join(' ')}
                        >
                            Risco {riskProfileLabels[riskKey] ?? riskKey}
                        </span>
                    )}
                </div>

                {/* Info compacta */}
                <dl className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                        <dt>Tipo:</dt>
                        <dd className="text-foreground font-medium">
                            {strategyTypeLabels[typeKey] ?? typeKey}
                        </dd>
                    </div>

                    {rewardKey && (
                        <div className="flex justify-between">
                            <dt>Retorno:</dt>
                            <dd className="text-foreground font-medium">
                                {rewardProfileLabels[rewardKey] ?? rewardKey}
                            </dd>
                        </div>
                    )}

                    {riskKey && (
                        <div className="flex justify-between">
                            <dt>Risco:</dt>
                            <dd className="text-foreground font-medium">
                                {riskProfileLabels[riskKey] ?? riskKey}
                            </dd>
                        </div>
                    )}

                    {volKey && (
                        <div className="flex justify-between">
                            <dt>Volatilidade:</dt>
                            <dd className="text-foreground font-medium">
                                {volatilityLabels[volKey] ?? volKey}
                            </dd>
                        </div>
                    )}
                </dl>
            </div>

            {/* Ações */}
            <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-border">
                <button
                    type="button"
                    className="ts-btn-secondary"
                    onClick={handleViewDetails}
                >
                    Ver detalhes
                </button>

                <button
                    type="button"
                    className="ts-btn-primary"
                    onClick={handleSimulate}
                >
                    Simular
                </button>
            </div>
        </div>
    );
}
