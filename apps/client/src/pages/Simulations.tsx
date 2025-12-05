import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Calculator,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Percent,
    Target,
    Plus,
    Trash2,
} from 'lucide-react';
import {
    useSimulations,
    useDeleteSimulation,
    SimulationListItem,
    SimulationStatus,
} from '@/hooks/useSimulations';

const PAGE_SIZE = 7;

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

function formatCurrency(value: number): string {
    return currencyFormatter.format(value);
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('pt-BR');
}

function getStatusLabel(status: SimulationStatus): string {
    return status === 'CONCLUDED' ? 'Concluída' : 'Em andamento';
}

function getStatusClasses(status: SimulationStatus): string {
    if (status === 'CONCLUDED') {
        return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40';
    }
    return 'bg-amber-500/10 text-amber-300 border border-amber-500/40';
}

function Simulations() {
    const {
        data: simulations = [],
        isLoading,
        isError,
    } = useSimulations();

    const {
        mutateAsync: deleteSimulation,
        isPending: isDeleting,
    } = useDeleteSimulation();

    const [currentPage, setCurrentPage] = useState(1);

    const totalSimulations = simulations.length;
    const totalInvested = simulations.reduce(
        (sum, s) => sum + s.initialCapital,
        0,
    );
    const totalProfit = simulations.reduce(
        (sum, s) => sum + (s.totalReturn ?? 0),
        0,
    );

    const averageRoi =
        totalSimulations > 0
            ? simulations.reduce(
                (sum, s) => sum + (s.returnPercentage ?? 0),
                0,
            ) / totalSimulations
            : 0;

    const successRate =
        totalSimulations > 0
            ? (simulations.filter((s) => (s.totalReturn ?? 0) > 0).length /
                totalSimulations) *
            100
            : 0;

    const totalPages =
        totalSimulations > 0
            ? Math.ceil(totalSimulations / PAGE_SIZE)
            : 1;

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const paginatedSimulations = simulations.slice(startIndex, endIndex);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const handleDeleteSimulation = async (
        simulation: SimulationListItem,
    ) => {
        const confirmed = window.confirm(
            `Tem certeza que deseja excluir a simulação "${simulation.simulationName}"? Essa ação não pode ser desfeita.`,
        );

        if (!confirmed) return;

        try {
            await deleteSimulation(simulation.id);
            toast.success('Simulação excluída com sucesso.');
        } catch (error) {
            console.error(error);
            toast.error('Não foi possível excluir a simulação.');
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-1">Simulações</h1>
                    <p className="text-sm text-muted-foreground">
                        Gerencie e acompanhe suas simulações de estratégias
                    </p>
                </div>

                <Link
                    to="/simulator"
                    className="ts-btn-primary gap-2 self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nova simulação</span>
                </Link>
            </header>

            {/* Métricas principais */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <MetricCard
                    label="Total"
                    value={totalSimulations.toString()}
                    icon={<Calculator className="w-4 h-4" />}
                    helper="Quantidade de simulações"
                />

                <MetricCard
                    label="Investido"
                    value={formatCurrency(totalInvested)}
                    icon={<DollarSign className="w-4 h-4" />}
                    helper="Soma dos valores investidos"
                />

                <MetricCard
                    label="Lucro Total"
                    value={formatCurrency(totalProfit)}
                    icon={<TrendingUp className="w-4 h-4" />}
                    helper="Resultado consolidado"
                    valueClassName={
                        totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }
                />

                <MetricCard
                    label="ROI Médio"
                    value={`${averageRoi.toFixed(1)}%`}
                    icon={<Percent className="w-4 h-4" />}
                    helper="Retorno médio das simulações"
                />

                <MetricCard
                    label="Taxa de acerto"
                    value={`${successRate.toFixed(0)}%`}
                    icon={<Target className="w-4 h-4" />}
                    helper="Proporção de simulações lucrativas"
                />
            </section>

            {/* Histórico de Simulações */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-xl font-semibold">
                        Histórico de Simulações
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Todas as suas simulações executadas
                    </p>
                </div>

                {isLoading && (
                    <p className="text-sm text-muted-foreground">
                        Carregando simulações...
                    </p>
                )}

                {isError && !isLoading && (
                    <p className="text-sm text-red-500">
                        Não foi possível carregar as simulações.
                    </p>
                )}

                {!isLoading && !isError && simulations.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Você ainda não possui simulações registradas.
                    </p>
                )}

                {!isLoading && !isError && simulations.length > 0 && (
                    <>
                        <div className="space-y-3">
                            {paginatedSimulations.map((simulation) => (
                                <SimulationRow
                                    key={simulation.id}
                                    simulation={simulation}
                                    onDelete={() =>
                                        handleDeleteSimulation(simulation)
                                    }
                                    isDeleting={isDeleting}
                                />
                            ))}
                        </div>

                        {/* Paginação */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 text-xs text-muted-foreground">
                            <span>
                                Mostrando{' '}
                                <strong>
                                    {startIndex + 1}–
                                    {Math.min(endIndex, totalSimulations)}
                                </strong>{' '}
                                de <strong>{totalSimulations}</strong>{' '}
                                simulações
                            </span>

                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.max(1, p - 1),
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    className="ts-btn-secondary px-3 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Anterior
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.min(totalPages, p + 1),
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                    className="ts-btn-secondary px-3 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}

export default Simulations;

interface MetricCardProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    helper?: string;
    valueClassName?: string;
}

function MetricCard({
    label,
    value,
    icon,
    helper,
    valueClassName,
}: MetricCardProps) {
    return (
        <div className="ts-glass-surface ts-glass-hover-soft rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {label}
                    </p>
                    <p
                        className={`mt-2 text-2xl font-semibold ${valueClassName ?? ''
                            }`}
                    >
                        {value}
                    </p>
                    {helper && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {helper}
                        </p>
                    )}
                </div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted/70">
                    {icon}
                </div>
            </div>
        </div>
    );
}

interface SimulationRowProps {
    simulation: SimulationListItem;
    onDelete: () => void;
    isDeleting: boolean;
}

function SimulationRow({
    simulation,
    onDelete,
    isDeleting,
}: SimulationRowProps) {
    const {
        simulationName,
        strategyName,
        assetSymbol,
        status,
        startDate,
        endDate,
        initialCapital,
        totalReturn,
    } = simulation;

    const profit = totalReturn ?? 0;
    const roi =
        initialCapital > 0 ? (profit / initialCapital) * 100 : 0;
    const isPositive = profit >= 0;

    return (
        <article className="ts-glass-surface ts-glass-hover-lift rounded-xl px-5 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Esquerda: info da simulação */}
            <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-base md:text-lg">
                        {simulationName}
                    </h3>

                    {strategyName && (
                        <span className="text-xs text-muted-foreground">
                            {strategyName}
                        </span>
                    )}

                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/40">
                        {assetSymbol}
                    </span>

                    <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(
                            status,
                        )}`}
                    >
                        {getStatusLabel(status)}
                    </span>
                </div>

                <p className="text-xs md:text-sm text-muted-foreground">
                    Período: {formatDate(startDate)} – {formatDate(endDate)} ·{' '}
                    Investimento: {formatCurrency(initialCapital)}
                </p>
            </div>

            {/* Direita: resultado + ações */}
            <div className="flex items-end justify-end gap-3 min-w-[160px]">
                <div className="text-right space-y-1">
                    <p
                        className={`flex items-center justify-end gap-1 text-sm md:text-base font-semibold ${isPositive
                                ? 'text-emerald-400'
                                : 'text-red-400'
                            }`}
                    >
                        {isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : (
                            <TrendingDown className="w-4 h-4" />
                        )}
                        <span>
                            {isPositive ? '+' : ''}
                            {roi.toFixed(1)}%
                        </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {isPositive ? '+' : '-'}
                        {formatCurrency(Math.abs(profit))}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onDelete}
                    disabled={isDeleting}
                    title="Excluir simulação"
                    className="inline-flex items-center justify-center rounded-full border border-border/60 bg-background/40 p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </article>
    );
}