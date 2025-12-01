import { useState, useMemo, useEffect } from 'react';
import {
    Filter,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { useStrategies } from '@/hooks/useStrategies';

const PAGE_SIZE = 6;

const proficiencyLabels: Record<string, string> = {
    NOVICE: 'Iniciante',
    INTERMEDIATE: 'Intermediário',
    ADVANCED: 'Avançado',
    EXPERT: 'Expert',
};

const proficiencyBadge: Record<string, string> = {
    NOVICE: 'bg-emerald-500/10 text-emerald-300',
    INTERMEDIATE: 'bg-amber-500/10 text-amber-300',
    ADVANCED: 'bg-violet-500/10 text-violet-300',
    EXPERT: 'bg-fuchsia-500/10 text-fuchsia-300',
};

const outlookLabels: Record<string, string> = {
    BULLISH: 'Bullish',
    BEARISH: 'Bearish',
    NEUTRAL: 'Neutral',
};

const outlookBadge: Record<string, string> = {
    BULLISH: 'bg-emerald-500/10 text-emerald-300',
    BEARISH: 'bg-rose-500/10 text-rose-300',
    NEUTRAL: 'bg-slate-500/10 text-slate-200',
};

const volatilityLabels: Record<string, string> = {
    HIGH: 'Alta',
    NEUTRAL: 'Neutra',
    LOW: 'Baixa',
};

const riskProfileLabels: Record<string, string> = {
    CAPPED: 'Limitado',
    UNCAPPED: 'Ilimitado',
};

const riskProfileBadge: Record<string, string> = {
    CAPPED: 'bg-amber-500/10 text-amber-200',
    UNCAPPED: 'bg-rose-500/10 text-rose-200',
};

const rewardProfileLabels: Record<string, string> = {
    CAPPED: 'Limitado',
    UNCAPPED: 'Ilimitado',
};

const strategyTypeLabels: Record<string, string> = {
    CAPITAL_GAIN: 'Ganho de capital',
    INCOME: 'Renda',
    PROTECTION: 'Proteção',
};

interface FilterState {
    proficiencyLevel: string;
    marketOutlook: string;
    volatilityView: string;
    riskProfile: string;
    rewardProfile: string;
    strategyType: string;
}

export default function Strategies() {
    const [filters, setFilters] = useState<FilterState>({
        proficiencyLevel: '',
        marketOutlook: '',
        volatilityView: '',
        riskProfile: '',
        rewardProfile: '',
        strategyType: '',
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const activeFilters = useMemo(
        () =>
            Object.keys(filters).reduce((acc, key) => {
                const value = filters[key as keyof FilterState];
                if (value) {
                    acc[key as keyof FilterState] = value;
                }
                return acc;
            }, {} as Partial<FilterState>),
        [filters],
    );

    const { strategies, loading, error } = useStrategies(activeFilters);

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, searchTerm]);

    const filteredStrategies = useMemo(() => {
        if (!searchTerm.trim()) return strategies;
        const term = searchTerm.toLowerCase();

        return strategies.filter((s) => {
            const profKey = s.proficiencyLevel ?? '';
            const outlookKey = s.marketOutlook ?? '';
            const volKey = s.volatilityView ?? '';
            const riskKey = s.riskProfile ?? '';
            const rewardKey = s.rewardProfile ?? '';
            const typeKey = s.strategyType ?? '';

            const haystack = [
                s.name,
                s.summary,
                s.strategyType,
                s.marketOutlook,
                s.proficiencyLevel,
                s.volatilityView,
                s.riskProfile,
                s.rewardProfile,
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

            return haystack.includes(term);
        });
    }, [strategies, searchTerm]);

    // Paginação
    const totalStrategies = filteredStrategies.length;
    const totalPages = totalStrategies > 0 ? Math.ceil(totalStrategies / PAGE_SIZE) : 1;
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const paginatedStrategies = filteredStrategies.slice(startIndex, endIndex);
    const showingFrom = totalStrategies === 0 ? 0 : startIndex + 1;
    const showingTo = totalStrategies === 0 ? 0 : Math.min(endIndex, totalStrategies);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Catálogo de Estratégias</h1>
                <p className="text-muted-foreground">
                    Explore e aprenda sobre diferentes estratégias de opções
                </p>
            </div>

            {/* Filtros + busca */}
            <div className="bg-card/60 border border-border/60 backdrop-blur-md rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold">Filtros de Busca</h2>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Encontradas{' '}
                        <span className="font-semibold text-foreground">{totalStrategies}</span>{' '}
                        estratégia{totalStrategies === 1 ? '' : 's'}
                    </p>
                </div>

                {/* Linha principal: busca + 3 filtros “principais” */}
                <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
                    {/* Pesquisar */}
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium mb-2">Pesquisar</label>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nome, descrição, tipo..."
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/70"
                            />
                        </div>
                    </div>

                    {/* Nível de Experiência */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Nível de Experiência</label>
                        <select
                            value={filters.proficiencyLevel}
                            onChange={(e) => handleFilterChange('proficiencyLevel', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/70"
                        >
                            <option value="">Todos os níveis</option>
                            <option value="NOVICE">Iniciante</option>
                            <option value="INTERMEDIATE">Intermediário</option>
                            <option value="ADVANCED">Avançado</option>
                            <option value="EXPERT">Expert</option>
                        </select>
                    </div>

                    {/* Visão de Mercado */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Visão de Mercado</label>
                        <select
                            value={filters.marketOutlook}
                            onChange={(e) => handleFilterChange('marketOutlook', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/70"
                        >
                            <option value="">Todas as visões</option>
                            <option value="BULLISH">Bullish (alta)</option>
                            <option value="BEARISH">Bearish (baixa)</option>
                            <option value="NEUTRAL">Neutral (lateral)</option>
                        </select>
                    </div>

                    {/* Volatilidade */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Volatilidade</label>
                        <select
                            value={filters.volatilityView}
                            onChange={(e) => handleFilterChange('volatilityView', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/70"
                        >
                            <option value="">Todas</option>
                            <option value="HIGH">Alta</option>
                            <option value="NEUTRAL">Neutra</option>
                            <option value="LOW">Baixa</option>
                        </select>
                    </div>
                </div>

                {/* Botão de expansor */}
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setShowAdvancedFilters((prev) => !prev)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
                    >
                        {showAdvancedFilters ? 'Ocultar filtros avançados' : 'Mostrar filtros avançados'}
                        {showAdvancedFilters ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>
                </div>

                {showAdvancedFilters && (
                    <div className="grid gap-4 md:grid-cols-3 pt-2">
                        {/* Perfil de Risco */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Perfil de Risco</label>
                            <select
                                value={filters.riskProfile}
                                onChange={(e) => handleFilterChange('riskProfile', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/70"
                            >
                                <option value="">Todos os perfis</option>
                                <option value="CAPPED">Risco limitado</option>
                                <option value="UNCAPPED">Risco ilimitado</option>
                            </select>
                        </div>

                        {/* Perfil de Retorno */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Perfil de Retorno</label>
                            <select
                                value={filters.rewardProfile}
                                onChange={(e) => handleFilterChange('rewardProfile', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/70"
                            >
                                <option value="">Todos os perfis</option>
                                <option value="CAPPED">Retorno limitado</option>
                                <option value="UNCAPPED">Retorno ilimitado</option>
                            </select>
                        </div>

                        {/* Tipo de Estratégia */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Tipo de Estratégia</label>
                            <select
                                value={filters.strategyType}
                                onChange={(e) => handleFilterChange('strategyType', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/70"
                            >
                                <option value="">Todos os tipos</option>
                                <option value="CAPITAL_GAIN">Ganho de capital</option>
                                <option value="INCOME">Renda</option>
                                <option value="PROTECTION">Proteção</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Lista de estratégias */}
            <div>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                            <p className="text-muted-foreground">Carregando estratégias...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive">
                        Erro ao carregar estratégias: {error}
                    </div>
                ) : totalStrategies === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">
                            Nenhuma estratégia encontrada com os filtros selecionados
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Cards */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedStrategies.map((strategy) => {
                                const profKey = strategy.proficiencyLevel ?? '';
                                const outlookKey = strategy.marketOutlook ?? '';
                                const riskKey = strategy.riskProfile ?? '';
                                const volKey = strategy.volatilityView ?? '';
                                const rewardKey = strategy.rewardProfile ?? '';
                                const typeKey = strategy.strategyType ?? '';

                                return (
                                    <div
                                        key={strategy.id}
                                        className="bg-card/70 border border-border/70 rounded-2xl p-6 shadow-sm hover:border-primary/70 hover:shadow-lg hover:bg-card/90 transition-all flex flex-col"
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
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    window.location.href = `/strategies/${strategy.id}`;
                                                }}
                                            >
                                                Ver detalhes
                                            </button>

                                            <button
                                                type="button"
                                                className="ts-btn-primary"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    // TODO: conectar com simulador
                                                    console.log('Simular estratégia', strategy.id);
                                                }}
                                            >
                                                Simular
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Paginação */}
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                            <p className="text-muted-foreground">
                                Mostrando{' '}
                                <span className="font-medium text-foreground">
                                    {showingFrom}–{showingTo}
                                </span>{' '}
                                de{' '}
                                <span className="font-medium text-foreground">
                                    {totalStrategies}
                                </span>{' '}
                                estratégias
                            </p>

                            <div className="inline-flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-card/70 px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-card/90 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>Anterior</span>
                                </button>

                                <span className="text-muted-foreground">
                                    Página{' '}
                                    <span className="font-medium text-foreground">{currentPage}</span>{' '}
                                    de{' '}
                                    <span className="font-medium text-foreground">{totalPages}</span>
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                                    }
                                    disabled={currentPage === totalPages}
                                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-card/70 px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-card/90 transition-colors"
                                >
                                    <span>Próxima</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
