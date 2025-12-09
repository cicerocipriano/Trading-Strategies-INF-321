import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>(
        'react-router-dom',
    );

    const mockNavigate = vi.fn();
    const mockUseParams = vi.fn();

    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: mockUseParams,
        __mockedNavigate: mockNavigate,
        __mockedUseParams: mockUseParams,
    };
});

vi.mock('@/hooks/useStrategies', () => ({
    useStrategy: vi.fn(),
}));

import StrategyDetail from '@/pages/StrategyDetail';

import { useStrategy, type Strategy } from '@/hooks/useStrategies';
import * as ReactRouterDom from 'react-router-dom';

import { renderWithProviders } from '../test-utils';

type StrategyLegMock = {
    action?: string;
    instrumentType?: string;
    quantityRatio?: number;
    strikeRelation?: string;
    orderSequence?: number | null;
};

const useStrategyMocked = vi.mocked(useStrategy);

type RouterDomWithMocks = {
    __mockedNavigate: Mock<(path: string, options?: unknown) => void>;
    __mockedUseParams: Mock<() => { id?: string }>;
};

const routerDomMocks = ReactRouterDom as unknown as RouterDomWithMocks;

const navigateMock = routerDomMocks.__mockedNavigate;
const useParamsMock = routerDomMocks.__mockedUseParams;

type StrategyWithLegs = Strategy & { legs: StrategyLegMock[] };

const baseStrategy: StrategyWithLegs = {
    id: 'strategy-1',
    name: 'Long Call',
    summary: 'Resumo da estratégia',
    description: 'Compra de call apostando em alta do ativo.',
    proficiencyLevel: 'INTERMEDIATE',
    marketOutlook: 'BULLISH',
    volatilityView: 'RISING',
    strategyType: 'DIRECTIONAL',
    riskProfile: 'MEDIUM',
    rewardProfile: 'HIGH',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    legs: [
        {
            action: 'Comprar',
            instrumentType: 'Call',
            quantityRatio: 1,
            strikeRelation: 'ATM',
            orderSequence: 1,
        },
        {
            action: 'Vender',
            instrumentType: 'Call',
            quantityRatio: 1,
            strikeRelation: 'OTM',
            orderSequence: 2,
        },
    ],
};

function renderStrategyDetail() {
    return renderWithProviders(
        <ReactRouterDom.MemoryRouter
            initialEntries={[`/strategies/${baseStrategy.id}`]}
        >
            <StrategyDetail />
        </ReactRouterDom.MemoryRouter>,
    );
}

describe('StrategyDetail page', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        useParamsMock.mockReturnValue({ id: baseStrategy.id });

        useStrategyMocked.mockReturnValue({
            strategy: baseStrategy,
            loading: false,
            error: null,
        });
    });

    it('chama useStrategy com o id da rota', () => {
        renderStrategyDetail();

        expect(useStrategyMocked).toHaveBeenCalledWith(baseStrategy.id);
    });

    it('renderiza estado de carregamento quando loading = true', () => {
        useStrategyMocked.mockReturnValue({
            strategy: null,
            loading: true,
            error: null,
        });

        renderStrategyDetail();

        expect(
            screen.getByText(/Carregando estratégia/i),
        ).toBeInTheDocument();
    });

    it('renderiza estado de erro quando hook retorna erro', () => {
        useStrategyMocked.mockReturnValue({
            strategy: null,
            loading: false,
            error: 'Falha ao buscar',
        });

        renderStrategyDetail();

        expect(
            screen.getByRole('link', { name: /Voltar para estratégias/i }),
        ).toBeInTheDocument();

        expect(
            screen.getByText(/Erro ao carregar estratégia/i),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Falha ao buscar/i),
        ).toBeInTheDocument();
    });

    it('mostra mensagem "Estratégia não encontrada" quando não há strategy nem erro', () => {
        useStrategyMocked.mockReturnValue({
            strategy: null,
            loading: false,
            error: null,
        });

        renderStrategyDetail();

        expect(
            screen.getByText(/Estratégia não encontrada/i),
        ).toBeInTheDocument();
    });

    it('renderiza detalhes da estratégia quando strategy está disponível', () => {
        renderStrategyDetail();

        expect(
            screen.getByRole('link', { name: /Voltar para estratégias/i }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('heading', { name: 'Long Call' }),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /Compra de call apostando em alta do ativo./i,
            ),
        ).toBeInTheDocument();

        expect(screen.getByText('Nível')).toBeInTheDocument();
        expect(screen.getByText('Perspectiva')).toBeInTheDocument();
        expect(screen.getByText('Volatilidade')).toBeInTheDocument();
        expect(screen.getAllByText('Tipo').length).toBeGreaterThan(0);

        expect(screen.getByText('DIRECTIONAL')).toBeInTheDocument();

        expect(
            screen.getByText(/Perfil de risco:/i),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Perfil de retorno:/i),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('heading', {
                name: /Pernas da Estratégia/i,
            }),
        ).toBeInTheDocument();

        expect(screen.getByText('Comprar')).toBeInTheDocument();
        expect(screen.getByText('Vender')).toBeInTheDocument();
        const callElements = screen.getAllByText('Call');
        expect(callElements.length).toBe(2);
        callElements.forEach(el => expect(el).toBeInTheDocument());
        expect(screen.getByText('ATM')).toBeInTheDocument();
        expect(screen.getByText('OTM')).toBeInTheDocument();
    });

    it('quando não há pernas, não renderiza seção "Pernas da Estratégia"', () => {
        const strategyWithoutLegs: StrategyWithLegs = {
            ...baseStrategy,
            legs: [],
        };

        useStrategyMocked.mockReturnValue({
            strategy: strategyWithoutLegs,
            loading: false,
            error: null,
        });

        renderStrategyDetail();

        expect(
            screen.queryByRole('heading', {
                name: /Pernas da Estratégia/i,
            }),
        ).not.toBeInTheDocument();
    });

    it('botão "Simular Estratégia" navega para /simulator com state correto', () => {
        renderStrategyDetail();

        const simulateButton = screen.getByRole('button', {
            name: /Simular Estratégia/i,
        });

        fireEvent.click(simulateButton);

        expect(navigateMock).toHaveBeenCalledTimes(1);
        const [path, options] = navigateMock.mock.calls[0];

        expect(path).toBe('/simulator');
        expect(options).toMatchObject({
            state: {
                strategyId: baseStrategy.id,
                strategyName: baseStrategy.name,
            },
        });
    });
});
