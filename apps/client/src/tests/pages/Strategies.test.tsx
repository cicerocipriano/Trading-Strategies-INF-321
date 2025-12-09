import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';

import { PAGE_SIZE } from '@/components/strategies/constants';
import { renderWithProviders } from '../test-utils';

vi.mock('@/hooks/useStrategies', () => {
    return {
        useStrategies: vi.fn(),
    };
});

vi.mock('@/components/strategies/StrategyCard', () => ({
    StrategyCard: (props: { strategy: { name: string } }) => (
        <div data-testid="strategy-card">{props.strategy.name}</div>
    ),
}));

vi.mock('@/components/strategies/StrategyFilters', () => ({
    StrategiesFilters: (props: any) => (
        <div data-testid="strategies-filters">
            <span data-testid="filters-total">
                total: {props.totalStrategies}
            </span>
            <button
                type="button"
                data-testid="apply-prof-filter"
                onClick={() =>
                    props.onFilterChange('proficiencyLevel', 'NOVICE')
                }
            >
                aplicar-filtro-proficiencia
            </button>
            <button
                type="button"
                data-testid="apply-search-call"
                onClick={() => props.onSearchChange('call')}
            >
                aplicar-busca-call
            </button>
        </div>
    ),
}));

vi.mock('@/components/strategies/StrategyPagination', () => ({
    StrategiesPagination: (props: any) => (
        <div data-testid="strategies-pagination">
            <span data-testid="pagination-page">
                Página {props.currentPage} de {props.totalPages}
            </span>
            <span data-testid="pagination-count">
                Mostrando {props.showingFrom}-{props.showingTo} de{' '}
                {props.totalStrategies}
            </span>
            <button
                type="button"
                data-testid="pagination-prev"
                onClick={() => props.onPageChange(props.currentPage - 1)}
            >
                prev
            </button>
            <button
                type="button"
                data-testid="pagination-next"
                onClick={() => props.onPageChange(props.currentPage + 1)}
            >
                next
            </button>
        </div>
    ),
}));


import { useStrategies } from '@/hooks/useStrategies';
import Strategies from '@/pages/Strategies';


interface MockStrategy {
    id: string;
    name: string;
    summary: string;
    proficiencyLevel?: string;
    marketOutlook?: string;
    volatilityView?: string;
    riskProfile?: string;
    rewardProfile?: string;
    strategyType?: string;
}

interface UseStrategiesReturn {
    strategies: MockStrategy[];
    loading: boolean;
    error: string | null;
}

type UseStrategiesFn = (filters: Record<string, string>) => UseStrategiesReturn;
type UseStrategiesMock = ReturnType<typeof vi.fn<UseStrategiesFn>>;

const useStrategiesMocked = useStrategies as unknown as UseStrategiesMock;

function renderStrategies() {
    return renderWithProviders(<Strategies />);
}

describe('Strategies page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('exibe estado de carregamento quando hook retorna loading=true', () => {
        useStrategiesMocked.mockReturnValue({
            strategies: [],
            loading: true,
            error: null,
        });

        renderStrategies();

        expect(
            screen.getByText('Carregando estratégias...'),
        ).toBeInTheDocument();
    });

    it('exibe mensagem de erro quando hook retorna error', () => {
        useStrategiesMocked.mockReturnValue({
            strategies: [],
            loading: false,
            error: 'Falha ao buscar dados',
        });

        renderStrategies();

        expect(
            screen.getByText(
                /Erro ao carregar estratégias: Falha ao buscar dados/i,
            ),
        ).toBeInTheDocument();
    });

    it('exibe mensagem de vazio quando não há estratégias filtradas', () => {
        useStrategiesMocked.mockReturnValue({
            strategies: [],
            loading: false,
            error: null,
        });

        renderStrategies();

        expect(
            screen.getByText(
                /Nenhuma estratégia encontrada com os filtros selecionados/i,
            ),
        ).toBeInTheDocument();
    });

    it('renderiza cards de estratégias e paginação com mais de uma página', () => {
        const total = PAGE_SIZE + 2;
        const strategies: MockStrategy[] = Array.from({ length: total }).map(
            (_, idx) => ({
                id: `s-${idx + 1}`,
                name: `Strategy ${idx + 1}`,
                summary: `Resumo ${idx + 1}`,
            }),
        );

        useStrategiesMocked.mockReturnValue({
            strategies,
            loading: false,
            error: null,
        });

        renderStrategies();


        expect(
            screen.getByRole('heading', {
                name: /Catálogo de Estratégias/i,
            }),
        ).toBeInTheDocument();

        const cardsPage1 = screen.getAllByTestId('strategy-card');
        expect(cardsPage1).toHaveLength(PAGE_SIZE);
        expect(cardsPage1[0]).toHaveTextContent('Strategy 1');

        expect(
            screen.getByTestId('pagination-page'),
        ).toHaveTextContent('Página 1 de 2');
        expect(
            screen.getByTestId('pagination-count'),
        ).toHaveTextContent(
            `Mostrando 1-${PAGE_SIZE} de ${total}`,
        );

        fireEvent.click(screen.getByTestId('pagination-next'));

        const cardsPage2 = screen.getAllByTestId('strategy-card');
        expect(cardsPage2).toHaveLength(total - PAGE_SIZE);
        expect(cardsPage2[0]).toHaveTextContent(
            `Strategy ${PAGE_SIZE + 1}`,
        );

        expect(
            screen.getByTestId('pagination-page'),
        ).toHaveTextContent('Página 2 de 2');
        expect(
            screen.getByTestId('pagination-count'),
        ).toHaveTextContent(
            `Mostrando ${PAGE_SIZE + 1}-${total} de ${total}`,
        );
    });

    it('aplica busca local pelo termo (searchTerm) e filtra estratégias renderizadas', () => {
        const strategies: MockStrategy[] = [
            {
                id: 's-1',
                name: 'Long Call',
                summary: 'Compra de call',
                strategyType: 'LONG_CALL',
            },
            {
                id: 's-2',
                name: 'Long Put',
                summary: 'Compra de put',
                strategyType: 'LONG_PUT',
            },
        ];

        useStrategiesMocked.mockReturnValue({
            strategies,
            loading: false,
            error: null,
        });

        renderStrategies();

        let cards = screen.getAllByTestId('strategy-card');
        expect(cards).toHaveLength(2);
        expect(cards[0]).toHaveTextContent('Long Call');
        expect(cards[1]).toHaveTextContent('Long Put');

        const searchButton = screen.getByTestId('apply-search-call');
        fireEvent.click(searchButton);

        cards = screen.getAllByTestId('strategy-card');
        expect(cards).toHaveLength(1);
        expect(cards[0]).toHaveTextContent('Long Call');
    });

    it('passa totalStrategies correto para o componente de filtros', () => {
        const strategies: MockStrategy[] = [
            {
                id: 's-1',
                name: 'Estratégia 1',
                summary: 'Resumo 1',
            },
            {
                id: 's-2',
                name: 'Estratégia 2',
                summary: 'Resumo 2',
            },
            {
                id: 's-3',
                name: 'Estratégia 3',
                summary: 'Resumo 3',
            },
        ];

        useStrategiesMocked.mockReturnValue({
            strategies,
            loading: false,
            error: null,
        });

        renderStrategies();

        expect(
            screen.getByTestId('filters-total'),
        ).toHaveTextContent('total: 3');
    });

    it('quando um filtro é aplicado, useStrategies é chamado novamente com filtros ativos', () => {
        const strategies: MockStrategy[] = [
            {
                id: 's-1',
                name: 'Estratégia 1',
                summary: 'Resumo 1',
            },
        ];

        useStrategiesMocked.mockReturnValue({
            strategies,
            loading: false,
            error: null,
        });

        renderStrategies();

        expect(useStrategiesMocked).toHaveBeenCalledTimes(1);
        expect(useStrategiesMocked.mock.calls[0]?.[0]).toEqual({});

        const profButton = screen.getByTestId('apply-prof-filter');
        fireEvent.click(profButton);

        expect(useStrategiesMocked).toHaveBeenCalledTimes(2);
        const secondCallArg = useStrategiesMocked.mock.calls[1]?.[0];
        expect(secondCallArg).toEqual({ proficiencyLevel: 'NOVICE' });
    });
});