import {
    Filter,
    Search,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import type { FilterState } from '@/components/strategies/constants';

interface StrategiesFiltersProps {
    filters: FilterState;
    onFilterChange: (key: keyof FilterState, value: string) => void;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    showAdvancedFilters: boolean;
    onToggleAdvancedFilters: () => void;
    totalStrategies: number;
}

export function StrategiesFilters({
    filters,
    onFilterChange,
    searchTerm,
    onSearchChange,
    showAdvancedFilters,
    onToggleAdvancedFilters,
    totalStrategies,
}: StrategiesFiltersProps) {
    return (
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
                            onChange={(e) => onSearchChange(e.target.value)}
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
                        onChange={(e) => onFilterChange('proficiencyLevel', e.target.value)}
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
                        onChange={(e) => onFilterChange('marketOutlook', e.target.value)}
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
                        onChange={(e) => onFilterChange('volatilityView', e.target.value)}
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
                    onClick={onToggleAdvancedFilters}
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
                            onChange={(e) => onFilterChange('riskProfile', e.target.value)}
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
                            onChange={(e) => onFilterChange('rewardProfile', e.target.value)}
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
                            onChange={(e) => onFilterChange('strategyType', e.target.value)}
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
    );
}
