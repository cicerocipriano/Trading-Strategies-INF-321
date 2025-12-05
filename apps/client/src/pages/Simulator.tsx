import { useState, useMemo } from 'react';
import { Play, RotateCcw, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import {
    useStrategies,
    Strategy,
    StrategyFilters,
} from '@/hooks/useStrategies';
import {
    useMarketAssets,
    MarketAsset,
} from '@/hooks/useMarketAssets';

interface SimulatorLocationState {
    strategyId?: string;
    strategyName?: string;
}

type AuthUserWithId = {
    id: string;
};

export default function Simulator() {
    const location = useLocation();
    const navigate = useNavigate(); // <- NOVO
    const state = (location.state || {}) as SimulatorLocationState;

    const { user } = useAuth();
    const authUser = user as AuthUserWithId | null | undefined;

    const emptyFilters = useMemo<StrategyFilters>(() => ({}), []);
    const {
        strategies,
        loading: loadingStrategies,
        error: strategiesError,
    } = useStrategies(emptyFilters);

    const {
        data: assets = [],
        isLoading: loadingAssets,
        isError: errorAssets,
    } = useMarketAssets();

    const [formData, setFormData] = useState({
        strategyId: state.strategyId ?? '',
        assetSymbol: '',
        startDate: '',
        endDate: '',
        initialCapital: '',
        simulationName: state.strategyName
            ? `Simulação ${state.strategyName}`
            : '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!authUser?.id) {
            toast.error('Não foi possível identificar o usuário autenticado.');
            return;
        }

        const {
            strategyId,
            assetSymbol,
            startDate,
            endDate,
            initialCapital,
            simulationName,
        } = formData;

        if (!strategyId || !assetSymbol || !startDate || !endDate || !initialCapital) {
            toast.error('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        const capitalNumber = Number.parseFloat(
            initialCapital.replace(',', '.'),
        );

        if (!Number.isFinite(capitalNumber) || capitalNumber <= 0) {
            toast.error('Informe um capital inicial válido (maior que zero)');
            return;
        }

        try {
            setIsSubmitting(true);

            await apiService.createSimulation({
                userId: authUser.id,
                strategyId,
                assetSymbol,
                simulationName:
                    simulationName || `Simulação ${assetSymbol}`,
                startDate,
                endDate,
                initialCapital: capitalNumber.toFixed(2),
            });

            toast.success('Simulação criada com sucesso!');

            // Opcional: resetar antes de sair (não faz mal)
            setFormData({
                strategyId: '',
                assetSymbol: '',
                startDate: '',
                endDate: '',
                initialCapital: '',
                simulationName: '',
            });

            // REDIRECIONA PARA A PÁGINA DE SIMULAÇÕES
            navigate('/simulations');
        } catch (error) {
            console.error('Erro ao criar simulação', error);
            toast.error('Erro ao criar simulação');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            strategyId: '',
            assetSymbol: '',
            startDate: '',
            endDate: '',
            initialCapital: '',
            simulationName: '',
        });
    };

    const isLoadingForm = isSubmitting || loadingStrategies || loadingAssets;

    return (
        <div className="space-y-10">
            {/* Header */}
            <header className="space-y-2">
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                    Simulador
                </p>
                <h1 className="text-3xl md:text-4xl font-bold">
                    Simulador de Estratégias
                </h1>
                <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
                    Teste estratégias com dados históricos e visualize o desempenho
                    antes de colocar dinheiro real em risco.
                </p>
            </header>

            {/* Conteúdo principal: formulário + ajuda lateral */}
            <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] items-start">
                {/* Formulário */}
                <div className="ts-glass-surface ts-glass-hover-lift rounded-2xl p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-5 md:grid-cols-2">
                            {/* Nome da simulação */}
                            <div className="md:col-span-2">
                                <label
                                    htmlFor="simulationName"
                                    className="block text-sm font-medium mb-2 text-card-foreground/90"
                                >
                                    Nome da Simulação (Opcional)
                                </label>
                                <input
                                    id="simulationName"
                                    type="text"
                                    name="simulationName"
                                    value={formData.simulationName}
                                    onChange={handleChange}
                                    placeholder="Ex: Teste Long Call em PETR4"
                                    className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/60 text-sm"
                                    disabled={isLoadingForm}
                                />
                            </div>

                            {/* Estratégia */}
                            <div>
                                <label
                                    htmlFor="strategyId"
                                    className="block text-sm font-medium mb-2 text-card-foreground/90"
                                >
                                    Estratégia *
                                </label>
                                <select
                                    id="strategyId"
                                    name="strategyId"
                                    value={formData.strategyId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/60 text-sm"
                                    disabled={isLoadingForm}
                                >
                                    {loadingStrategies && (
                                        <option>Carregando estratégias...</option>
                                    )}

                                    {strategiesError && !loadingStrategies && (
                                        <option>
                                            Erro ao carregar estratégias
                                        </option>
                                    )}

                                    {!loadingStrategies && !strategiesError && (
                                        <>
                                            <option value="">
                                                Selecione uma estratégia
                                            </option>
                                            {strategies.map((s: Strategy) => (
                                                <option
                                                    key={s.id}
                                                    value={s.id}
                                                >
                                                    {s.name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>

                            {/* Ativo */}
                            <div>
                                <label
                                    htmlFor="assetSymbol"
                                    className="block text-sm font-medium mb-2 text-card-foreground/90"
                                >
                                    Ativo *
                                </label>
                                <select
                                    id="assetSymbol"
                                    name="assetSymbol"
                                    value={formData.assetSymbol}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/60 text-sm"
                                    disabled={isLoadingForm}
                                >
                                    {loadingAssets && (
                                        <option>Carregando ativos...</option>
                                    )}

                                    {errorAssets && !loadingAssets && (
                                        <option>
                                            Erro ao carregar ativos
                                        </option>
                                    )}

                                    {!loadingAssets && !errorAssets && (
                                        <>
                                            <option value="">
                                                Selecione um ativo
                                            </option>
                                            {assets.map((asset: MarketAsset) => (
                                                <option
                                                    key={asset.symbol}
                                                    value={asset.symbol}
                                                >
                                                    {asset.symbol} - {asset.shortName}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>

                            {/* Capital inicial */}
                            <div>
                                <label
                                    htmlFor="initialCapital"
                                    className="block text-sm font-medium mb-2 text-card-foreground/90"
                                >
                                    Capital inicial (R$) *
                                </label>
                                <input
                                    id="initialCapital"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="initialCapital"
                                    value={formData.initialCapital}
                                    onChange={handleChange}
                                    placeholder="Ex: 10000,00"
                                    className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/60 text-sm"
                                    disabled={isLoadingForm}
                                />
                            </div>

                            {/* Intervalo de datas */}
                            <div>
                                <label
                                    htmlFor="startDate"
                                    className="block text-sm font-medium mb-2 text-card-foreground/90"
                                >
                                    Data de Início *
                                </label>
                                <input
                                    id="startDate"
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/60 text-sm"
                                    disabled={isLoadingForm}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="endDate"
                                    className="block text-sm font-medium mb-2 text-card-foreground/90"
                                >
                                    Data de Término *
                                </label>
                                <input
                                    id="endDate"
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/60 text-sm"
                                    disabled={isLoadingForm}
                                />
                            </div>
                        </div>

                        {/* Botões */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={isLoadingForm}
                                className="ts-btn-primary w-full sm:w-auto gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <Play className="w-4 h-4" />
                                <span>
                                    {isSubmitting
                                        ? 'Simulando...'
                                        : 'Executar Simulação'}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={isLoadingForm}
                                className="ts-btn-secondary w-full sm:w-auto gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Limpar</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Card lateral de ajuda */}
                <aside className="ts-glass-surface ts-glass-hover-soft rounded-2xl p-6 lg:p-7 text-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-primary" />
                        <h2 className="font-semibold">Como funciona?</h2>
                    </div>

                    <p className="text-muted-foreground mb-4">
                        Monte um cenário com dados históricos do ativo para entender
                        como a estratégia teria performado no período escolhido.
                    </p>

                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>Selecione uma estratégia de opções.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>
                                Escolha o ativo (ação, ETF ou índice) que deseja analisar.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>Defina o período histórico que será usado na simulação.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>
                                Clique em <strong>Executar Simulação</strong> para ver o
                                lucro/prejuízo e as métricas de performance.
                            </span>
                        </li>
                    </ul>

                    <div className="mt-6 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Dica:</span>{' '}
                        comece com períodos menores para validar a estratégia e depois
                        expanda o horizonte de datas para análises mais longas.
                    </div>
                </aside>
            </section>
        </div>
    );
}