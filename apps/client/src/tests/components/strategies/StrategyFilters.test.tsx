import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StrategiesFilters } from '@/components/strategies/StrategyFilters';
import type { FilterState } from '@/components/strategies/constants';

type OnFilterChangeFn = (key: keyof FilterState, value: string) => void;
type OnSearchChangeFn = (value: string) => void;
type OnToggleAdvancedFiltersFn = () => void;

function createDefaultFilters(): FilterState {
    return {
        proficiencyLevel: '',
        marketOutlook: '',
        volatilityView: '',
        riskProfile: '',
        rewardProfile: '',
        strategyType: '',
    };
}

interface RenderOptions {
    filters?: FilterState;
    totalStrategies?: number;
    showAdvancedFilters?: boolean;
    onFilterChangeMock?: ReturnType<typeof vi.fn<OnFilterChangeFn>>;
    onSearchChangeMock?: ReturnType<typeof vi.fn<OnSearchChangeFn>>;
    onToggleAdvancedFiltersMock?: ReturnType<
        typeof vi.fn<OnToggleAdvancedFiltersFn>
    >;
}

function renderFilters(options: RenderOptions = {}) {
    const {
        filters = createDefaultFilters(),
        totalStrategies = 0,
        showAdvancedFilters = false,
        onFilterChangeMock = vi.fn<OnFilterChangeFn>(),
        onSearchChangeMock = vi.fn<OnSearchChangeFn>(),
        onToggleAdvancedFiltersMock = vi.fn<OnToggleAdvancedFiltersFn>(),
    } = options;

    render(
        <StrategiesFilters
            filters={filters}
            onFilterChange={onFilterChangeMock}
            searchTerm=""
            onSearchChange={onSearchChangeMock}
            showAdvancedFilters={showAdvancedFilters}
            onToggleAdvancedFilters={onToggleAdvancedFiltersMock}
            totalStrategies={totalStrategies}
        />,
    );

    return {
        onFilterChangeMock,
        onSearchChangeMock,
        onToggleAdvancedFiltersMock,
    };
}

describe('StrategiesFilters', () => {
    it('renderiza título, contador e campos principais', () => {
        renderFilters({ totalStrategies: 5 });

        expect(
            screen.getByText(/Filtros de Busca/i),
        ).toBeInTheDocument();

        expect(
            screen.getByText(/Encontradas/i),
        ).toBeInTheDocument();

        expect(
            screen.getByText('5', { selector: 'span' }),
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(/Pesquisar/i),
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(/Nível de Experiência/i),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText(/Visão de Mercado/i),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText(/Volatilidade/i),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: /Mostrar filtros avançados/i,
            }),
        ).toBeInTheDocument();
    });

    it('usa singular quando totalStrategies = 1', () => {
        renderFilters({ totalStrategies: 1 });

        const singularCounter = screen.getByText((_, element) =>
            element?.tagName === 'P' &&
            !!element.textContent?.match(/1 estratégia\b/i),
        );

        expect(singularCounter).toBeInTheDocument();
    });

    it('chama onSearchChange ao digitar no campo de busca', () => {
        const { onSearchChangeMock } = renderFilters();

        const input = screen.getByPlaceholderText(
            /Nome, descrição, tipo/i,
        );

        fireEvent.change(input, {
            target: { value: 'long call' },
        });

        expect(onSearchChangeMock).toHaveBeenCalledTimes(1);
        expect(onSearchChangeMock).toHaveBeenCalledWith('long call');
    });

    it('chama onFilterChange para Nível de Experiência', () => {
        const { onFilterChangeMock } = renderFilters();

        const select = screen.getByLabelText(/Nível de Experiência/i);

        fireEvent.change(select, {
            target: { value: 'INTERMEDIATE' },
        });

        expect(onFilterChangeMock).toHaveBeenCalledTimes(1);
        expect(onFilterChangeMock).toHaveBeenCalledWith(
            'proficiencyLevel',
            'INTERMEDIATE',
        );
    });

    it('chama onFilterChange para Visão de Mercado', () => {
        const { onFilterChangeMock } = renderFilters();

        const select = screen.getByLabelText(/Visão de Mercado/i);

        fireEvent.change(select, {
            target: { value: 'BULLISH' },
        });

        expect(onFilterChangeMock).toHaveBeenCalledTimes(1);
        expect(onFilterChangeMock).toHaveBeenCalledWith(
            'marketOutlook',
            'BULLISH',
        );
    });

    it('chama onFilterChange para Volatilidade', () => {
        const { onFilterChangeMock } = renderFilters();

        const select = screen.getByLabelText(/Volatilidade/i);

        fireEvent.change(select, {
            target: { value: 'HIGH' },
        });

        expect(onFilterChangeMock).toHaveBeenCalledTimes(1);
        expect(onFilterChangeMock).toHaveBeenCalledWith(
            'volatilityView',
            'HIGH',
        );
    });

    it('chama onToggleAdvancedFilters ao clicar no botão de filtros avançados', () => {
        const { onToggleAdvancedFiltersMock } = renderFilters({
            showAdvancedFilters: false,
        });

        const toggleButton = screen.getByRole('button', {
            name: /Mostrar filtros avançados/i,
        });

        fireEvent.click(toggleButton);

        expect(onToggleAdvancedFiltersMock).toHaveBeenCalledTimes(1);
    });

    it('quando showAdvancedFilters=true, mostra selects avançados e texto do botão muda', () => {
        const filters: FilterState = {
            proficiencyLevel: '',
            marketOutlook: '',
            volatilityView: '',
            riskProfile: 'CAPPED',
            rewardProfile: 'UNCAPPED',
            strategyType: 'INCOME',
        };

        renderFilters({
            filters,
            showAdvancedFilters: true,
        });

        expect(
            screen.getByRole('button', {
                name: /Ocultar filtros avançados/i,
            }),
        ).toBeInTheDocument();

        const riskSelect = screen.getByLabelText(/Perfil de Risco/i);
        const rewardSelect = screen.getByLabelText(/Perfil de Retorno/i);
        const typeSelect = screen.getByLabelText(/Tipo de Estratégia/i);

        expect(riskSelect).toBeInTheDocument();
        expect(rewardSelect).toBeInTheDocument();
        expect(typeSelect).toBeInTheDocument();

        expect(riskSelect).toHaveValue('CAPPED');
        expect(rewardSelect).toHaveValue('UNCAPPED');
        expect(typeSelect).toHaveValue('INCOME');
    });

    it('chama onFilterChange para filtros avançados (Perfil de Risco, Retorno, Tipo)', () => {
        const { onFilterChangeMock } = renderFilters({
            showAdvancedFilters: true,
        });

        const riskSelect = screen.getByLabelText(/Perfil de Risco/i);
        const rewardSelect = screen.getByLabelText(/Perfil de Retorno/i);
        const typeSelect = screen.getByLabelText(/Tipo de Estratégia/i);

        fireEvent.change(riskSelect, {
            target: { value: 'UNCAPPED' },
        });
        fireEvent.change(rewardSelect, {
            target: { value: 'CAPPED' },
        });
        fireEvent.change(typeSelect, {
            target: { value: 'PROTECTION' },
        });

        expect(onFilterChangeMock).toHaveBeenCalledTimes(3);

        expect(onFilterChangeMock).toHaveBeenNthCalledWith(
            1,
            'riskProfile',
            'UNCAPPED',
        );
        expect(onFilterChangeMock).toHaveBeenNthCalledWith(
            2,
            'rewardProfile',
            'CAPPED',
        );
        expect(onFilterChangeMock).toHaveBeenNthCalledWith(
            3,
            'strategyType',
            'PROTECTION',
        );
    });
});
