import { Link } from 'react-router-dom';
import {
    Activity,
    LineChart,
    Percent,
    Wallet,
    Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useRecentSimulations } from '@/hooks/useRecentSimulations';
import { useSimulationStatistics } from '@/hooks/useSimulationStatistics';
import { SuggestedStrategiesCard } from '@/components/dashboard/SuggestedStrategiesCard';
import type { ExperienceLevel } from '@/utils/strategyRecommender';

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();

    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 60) return `${minutes || 1} min atrás`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hora${hours > 1 ? 's' : ''} atrás`;

    const days = Math.floor(hours / 24);
    return `${days} dia${days > 1 ? 's' : ''} atrás`;
}

function Dashboard() {
    const { user } = useAuth();
    const displayName = user?.username || user?.email || 'Trader';

    const {
        data: recentSimulations = [],
        isLoading: isLoadingSimulations,
        isError: isErrorSimulations,
    } = useRecentSimulations();

    const {
        data: stats,
        isLoading: isLoadingStats,
    } = useSimulationStatistics();

    const totalSimulations = stats?.totalSimulations ?? 0;
    const winRate = stats?.winRate ?? '--';
    const avgReturn = stats?.avgReturn ?? '--';
    const simulatedCapital = stats?.simulatedCapital ?? 0;
    const experienceLevel = (user?.experienceLevel || 'BEGINNER') as ExperienceLevel;

    return (
        <div className="space-y-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Visão geral
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-semibold">
                        Olá, {displayName}! <span className="inline-block">👋</span>
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground max-w-xl">
                        Aqui você acompanha um resumo das suas estratégias, últimas
                        simulações e métricas de risco.
                    </p>
                </div>

                <Link
                    to="/simulator"
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition"
                >
                    <LineChart className="w-4 h-4 mr-2" />
                    Nova simulação
                </Link>
            </header>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Simulações totais
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                                {isLoadingStats ? '...' : totalSimulations}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Histórico do usuário
                            </p>
                        </div>
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                            <Activity className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>
                </div>


                <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                ROI médio
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                                {isLoadingStats ? '...' : avgReturn}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Retorno médio das simulações
                            </p>
                        </div>
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                            <Percent className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Taxa de acerto
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                                {isLoadingStats ? '...' : winRate}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Proporção de simulações lucrativas
                            </p>
                        </div>
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                            <Sparkles className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Capital simulado
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                                {isLoadingStats
                                    ? '...'
                                    : simulatedCapital.toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                    })}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Soma do capital inicial e resultados das suas simulações
                            </p>
                        </div>
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                            <Wallet className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Atividades recentes
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Suas últimas simulações e resultados.
                        </p>
                    </div>

                    {isLoadingSimulations && (
                        <p className="text-sm text-muted-foreground">
                            Carregando simulações...
                        </p>
                    )}

                    {isErrorSimulations && !isLoadingSimulations && (
                        <p className="text-sm text-red-500">
                            Não foi possível carregar as simulações.
                        </p>
                    )}

                    {!isLoadingSimulations &&
                        !isErrorSimulations &&
                        recentSimulations.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                Você ainda não possui simulações registradas. Que tal criar a
                                primeira?
                            </p>
                        )}

                    {!isLoadingSimulations && recentSimulations.length > 0 && (
                        <div className="space-y-3">
                            {recentSimulations.map((sim) => (
                                <div
                                    key={sim.id}
                                    className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{sim.simulationName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {sim.assetSymbol} · {formatTimeAgo(sim.createdAt)}
                                        </p>
                                    </div>

                                    {sim.returnPercentage !== null ? (
                                        <p
                                            className={`text-sm font-semibold ${sim.returnPercentage >= 0
                                                ? 'text-emerald-500'
                                                : 'text-red-500'
                                                }`}
                                        >
                                            {sim.returnPercentage > 0 ? '+' : ''}
                                            {sim.returnPercentage.toFixed(1)}%
                                        </p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            sem resultado
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-1">
                        <Link
                            to="/simulator"
                            className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition"
                        >
                            Ver todas as simulações
                        </Link>
                    </div>
                </div>

                {/* Estratégias sugeridas */}
                <SuggestedStrategiesCard
                    experienceLevel={experienceLevel}
                    winRate={winRate}
                    avgReturn={avgReturn}
                />
            </section>
        </div>
    );
}

export default Dashboard;
