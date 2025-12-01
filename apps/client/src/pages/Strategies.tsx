import { useMemo, useState } from 'react';
import { useStrategies } from '@/hooks/useStrategies';

import {
    PAGE_SIZE,
    FilterState,
    proficiencyLabels,
    outlookLabels,
    volatilityLabels,
    riskProfileLabels,
    rewardProfileLabels,
    strategyTypeLabels,
} from '@/components/strategies/constants';

import { StrategiesFilters } from '@/components/strategies/StrategyFilters';
import { StrategyCard } from '@/components/strategies/StrategyCard';
import { StrategiesPagination } from '@/components/strategies/StrategyPagination';

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
        setCurrentPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

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
            <StrategiesFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                showAdvancedFilters={showAdvancedFilters}
                onToggleAdvancedFilters={() =>
                    setShowAdvancedFilters((prev) => !prev)
                }
                totalStrategies={totalStrategies}
            />

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
                            {paginatedStrategies.map((strategy) => (
                                <StrategyCard key={strategy.id} strategy={strategy} />
                            ))}
                        </div>

                        {/* Paginação */}
                        <StrategiesPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            showingFrom={showingFrom}
                            showingTo={showingTo}
                            totalStrategies={totalStrategies}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
