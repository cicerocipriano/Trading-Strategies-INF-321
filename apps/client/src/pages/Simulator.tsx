import { useMarketAssets } from '@/hooks/useMarketAssets';
import { useMemo, useState } from 'react';
import { Play, RotateCcw, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

import { useStrategies, type StrategyFilters } from '@/hooks/useStrategies';
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

interface SimulatorLocationState {
    strategyId?: string;
    strategyName?: string;
}

interface AuthUserWithId {
    id: string;
}

const ASSET_OPTIONS = [
    { id: '1', symbol: 'PETR4', label: 'PETR4 - Petrobras' },
    { id: '2', symbol: 'VALE3', label: 'VALE3 - Vale' },
    { id: '3', symbol: 'ITUB4', label: 'ITUB4 - Itaú' },
    { id: '4', symbol: 'BBDC4', label: 'BBDC4 - Bradesco' },
    { id: '5', symbol: 'WEGE3', label: 'WEGE3 - WEG' },
];

export default function Simulator() {
    const location = useLocation();
    const state = (location.state || {}) as SimulatorLocationState;

    const { user } = useAuth();
    const userId = (user as AuthUserWithId | null | undefined)?.id;

    // Filtros vazios com referência estável (pra não entrar em loop no hook)
    const emptyFilters = useMemo<StrategyFilters>(() => ({}), []);
    const {
        strategies,
        loading: loadingStrategies,
        error: strategiesError,
    } = useStrategies(emptyFilters);

    const [formData, setFormData] = useState({
        strategyId: state.strategyId ?? '',
        assetId: '',
        startDate: '',
        endDate: '',
        // agora o nome é totalmente livre; só o placeholder sugere algo
        simulationName: '',
    });

    const [isLoading, setIsLoading] = useState(false);

    const {
        data: assets = [],
        isLoading: isLoadingAssets,
        isError: isAssetsError,
    } = useMarketAssets();


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

        if (!userId) {
            toast.error('Não foi possível identificar o usuário. Faça login novamente.');
            return;
        }

        if (
            !formData.strategyId ||
            !formData.assetId ||
            !formData.startDate ||
            !formData.endDate
        ) {
            toast.error('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        const selectedAsset = ASSET_OPTIONS.find(
            (asset) => asset.id === formData.assetId,
        );

        if (!selectedAsset) {
            toast.error('Selecione um ativo válido');
            return;
        }

        try {
            setIsLoading(true);

            // Chamada real para o backend
            await apiService.createSimulation({
                userId,
                strategyId: formData.strategyId,
                assetSymbol: selectedAsset.symbol,
                simulationName:
                    formData.simulationName && formData.simulationName.trim().length > 0
                        ? formData.simulationName.trim()
                        : undefined,
                startDate: formData.startDate, // "YYYY-MM-DD" vindo do input date
                endDate: formData.endDate,
                // por enquanto usamos um valor fixo; depois podemos expor esse campo no form
                initialCapital: '0',
            });

            toast.success('Simulação criada com sucesso!');

            setFormData({
                strategyId: '',
                assetId: '',
                startDate: '',
                endDate: '',
                simulationName: '',
            });
        } catch (err) {
            console.error('Erro ao criar simulação', err);
            toast.error('Erro ao criar simulação. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            strategyId: '',
            assetId: '',
            startDate: '',
            endDate: '',
            simulationName: '',
        });
    };

    const simulationNamePlaceholder = state.strategyName
        ? `Ex: ${state.strategyName} em PETR4`
        : 'Ex: Teste Long Call em PETR4';

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
                                    placeholder={simulationNamePlaceholder}
                                    className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/60 text-sm"
                                    disabled={isLoading}
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
                                    disabled={isLoading || loadingStrategies}
                                >
                                    <option value="">
                                        {loadingStrategies
                                            ? 'Carregando estratégias...'
                                            : 'Selecione uma estratégia'}
                                    </option>

                                    {!loadingStrategies &&
                                        strategies.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                </select>

                                {strategiesError && (
                                    <p className="mt-1 text-xs text-red-500">
                                        Não foi possível carregar a lista de estratégias.
                                    </p>
                                )}
                            </div>

                            {/* Ativo */}
                            <div>
                                <label
                                    htmlFor="assetId"
                                    className="block text-sm font-medium mb-2 text-card-foreground/90"
                                >
                                    Ativo *
                                </label>
                                <select
                                    id="assetId"
                                    name="assetId"
                                    value={formData.assetId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/60 text-sm"
                                    disabled={isLoading || isLoadingAssets} >
                                    <option value="">
                                        {isLoadingAssets
                                            ? 'Carregando ativos...'
                                            : 'Selecione um ativo'}
                                    </option>

                                    {!isLoadingAssets &&
                                        assets.map((asset) => (
                                            <option
                                                key={asset.symbol}
                                                value={asset.symbol} >
                                                {asset.symbol.replace('.SA', '')} -{' '}
                                                {asset.shortName}
                                            </option>
                                        ))}
                                </select>

                                {isAssetsError && (
                                    <p className="mt-1 text-xs text-red-500">
                                        Não foi possível carregar a lista de ativos.
                                    </p>
                                )}
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
                                    disabled={isLoading}
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
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Botões */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="ts-btn-primary w-full sm:w-auto gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <Play className="w-4 h-4" />
                                <span>
                                    {isLoading ? 'Simulando...' : 'Executar Simulação'}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={isLoading}
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