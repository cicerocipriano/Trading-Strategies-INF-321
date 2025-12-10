import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity } from 'lucide-react';
import { useStrategy } from '@/hooks/useStrategies';
import {
    proficiencyLabels,
    outlookLabels,
    volatilityLabels,
    strategyTypeLabels,
    riskProfileLabels,
    rewardProfileLabels,
} from '@/components/strategies/constants';

export default function StrategyDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { strategy, loading, error } = useStrategy(id || '');

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        Carregando estratégia...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !strategy) {
        return (
            <div className="space-y-4">
                <Link
                    to="/strategies"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar para estratégias</span>
                </Link>

                <div className="ts-glass-surface rounded-xl border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    Erro ao carregar estratégia: {error ?? 'Estratégia não encontrada'}
                </div>
            </div>
        );
    }

    const legs = (strategy.legs ?? []) as Array<{
        action?: string;
        instrumentType?: string;
        quantityRatio?: number;
        strikeRelation?: string;
        orderSequence?: number | null;
    }>;

    const handleSimulateClick = () => {
        navigate('/simulator', {
            state: {
                strategyId: strategy.id,
                strategyName: strategy.name,
            },
        });
    };

    const profLabel =
        proficiencyLabels[strategy.proficiencyLevel] ??
        strategy.proficiencyLevel;
    const outlookLabel =
        outlookLabels[strategy.marketOutlook] ?? strategy.marketOutlook;
    const volLabel =
        volatilityLabels[strategy.volatilityView] ?? strategy.volatilityView;
    const typeLabel =
        strategyTypeLabels[strategy.strategyType] ?? strategy.strategyType;
    const riskLabel =
        riskProfileLabels[strategy.riskProfile] ?? strategy.riskProfile;
    const rewardLabel =
        rewardProfileLabels[strategy.rewardProfile] ?? strategy.rewardProfile;

    return (
        <div className="space-y-8">
            {/* Voltar */}
            <Link
                to="/strategies"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para estratégias</span>
            </Link>

            {/* Cabeçalho */}
            <header className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <Activity className="w-3 h-3" />
                    Estratégia de Opções
                </div>

                <h1 className="text-3xl md:text-4xl font-bold">
                    {strategy.name}
                </h1>

                {strategy.description && (
                    <p className="text-sm md:text-base text-muted-foreground max-w-3xl">
                        {strategy.description}
                    </p>
                )}
            </header>

            {/* Cards de info principal */}
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <InfoCard label="Nível" value={profLabel} />
                <InfoCard label="Perspectiva" value={outlookLabel} />
                <InfoCard label="Volatilidade" value={volLabel} />
                <InfoCard label="Tipo" value={typeLabel} />
            </section>

            {/* Chips de risco / retorno (se houver) */}
            {(riskLabel || rewardLabel) && (
                <section className="flex flex-wrap gap-2">
                    {riskLabel && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-200 border border-amber-500/40">
                            Perfil de risco: {riskLabel}
                        </span>
                    )}
                    {rewardLabel && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-200 border border-emerald-500/40">
                            Perfil de retorno: {rewardLabel}
                        </span>
                    )}
                </section>
            )}

            {/* Pernas */}
            {legs.length > 0 && (
                <section className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-semibold">
                            Pernas da Estratégia
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Estrutura básica de compra/venda que compõe a
                            estratégia.
                        </p>
                    </div>

                    <div className="ts-glass-surface rounded-2xl overflow-hidden border border-border/60">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 border-b border-border/60">
                                <tr>
                                    <Th>Ação</Th>
                                    <Th>Tipo</Th>
                                    <Th>Quantidade</Th>
                                    <Th>Strike</Th>
                                    <Th>Sequência</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {legs.map((leg) => (
                                    <tr
                                        key={`${leg.orderSequence ?? 'seq'}-${leg.action ?? 'action'}-${leg.instrumentType ?? 'instrument'}-${leg.quantityRatio ?? 'qty'}-${leg.strikeRelation ?? 'strike'}`}
                                        className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                                    >
                                        <Td>{leg.action}</Td>
                                        <Td>{leg.instrumentType}</Td>
                                        <Td>{leg.quantityRatio}</Td>
                                        <Td>{leg.strikeRelation}</Td>
                                        <Td>
                                            {leg.orderSequence}
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* CTA */}
            <section className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                    type="button"
                    onClick={handleSimulateClick}
                    className="ts-btn-primary w-full sm:w-auto"
                >
                    Simular Estratégia
                </button>

                <Link
                    to="/strategies"
                    className="ts-btn-secondary w-full sm:w-auto text-center"
                >
                    Voltar para lista
                </Link>
            </section>
        </div>
    );
}

/* --- Componentes auxiliares para manter o layout limpo --- */

interface InfoCardProps {
    label: string;
    value?: string | null;
}

function InfoCard({ label, value }: InfoCardProps) {
    return (
        <div className="ts-glass-surface ts-glass-hover-soft rounded-2xl p-4 md:p-5 flex flex-col justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className="mt-2 text-lg font-semibold">
                {value ?? '-'}
            </p>
        </div>
    );
}

function Th({ children }: { children: React.ReactNode }) {
    return (
        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {children}
        </th>
    );
}

function Td({ children }: { children: React.ReactNode }) {
    return (
        <td className="px-4 py-3 text-sm align-middle text-foreground/90">
            {children}
        </td>
    );
}
