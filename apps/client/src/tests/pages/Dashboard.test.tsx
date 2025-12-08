import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';

import Dashboard from '@/pages/Dashboard';
import { useAuth } from '@/hooks/useAuth';
import { useRecentSimulations } from '@/hooks/useRecentSimulations';
import { useSimulationStatistics } from '@/hooks/useSimulationStatistics';
import type { ExperienceLevel } from '@/utils/strategyRecommender';
import { renderWithProviders } from '../test-utils';
import { createAuthMock } from '../mocks/authMocks';
import { MemoryRouter } from 'react-router-dom';

function renderDashboard() {
    return renderWithProviders(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>,
    );
}

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@/hooks/useRecentSimulations', () => ({
    useRecentSimulations: vi.fn(),
}));

vi.mock('@/hooks/useSimulationStatistics', () => ({
    useSimulationStatistics: vi.fn(),
}));
vi.mock('@/components/dashboard/SuggestedStrategiesCard', () => ({
    SuggestedStrategiesCard: (props: {
        experienceLevel: ExperienceLevel;
        winRate: string | number;
        avgReturn: string | number;
        children?: ReactNode;
    }) => (
        <div data-testid="suggested-strategies-card">
            Suggested Strategies - level:{String(props.experienceLevel)} - winRate:
            {String(props.winRate)} - avgReturn:{String(props.avgReturn)}
            {props.children}
        </div>
    ),
}));

const useAuthMocked = vi.mocked(useAuth);
const useRecentSimulationsMocked = vi.mocked(useRecentSimulations);
const useSimulationStatisticsMocked = vi.mocked(useSimulationStatistics);

interface RecentSimulation {
    id: string;
    simulationName: string;
    assetSymbol: string;
    createdAt: string;
    returnPercentage: number | null;
}

interface SimulationStats {
    totalSimulations: number;
    winRate: string;
    avgReturn: string;
    simulatedCapital: number;
}

describe('Dashboard', () => {
    const baseUser = {
        id: 'user-1',
        username: 'TestUser',
        email: 'test@example.com',
        experienceLevel: 'NOVICE' as ExperienceLevel,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
    };

    const defaultStats: SimulationStats = {
        totalSimulations: 0,
        winRate: '--',
        avgReturn: '--',
        simulatedCapital: 0,
    };

    beforeEach(() => {
        vi.clearAllMocks();

        useAuthMocked.mockReturnValue(
            createAuthMock({
                user: baseUser,
                isAuthenticated: true,
            }),
        );

        useRecentSimulationsMocked.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useRecentSimulations>);

        useSimulationStatisticsMocked.mockReturnValue({
            data: defaultStats,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useSimulationStatistics>);
    });

    it('exibe saudação usando o username do usuário', () => {
        renderDashboard();

        expect(
            screen.getByText(/Olá, TestUser!/, { selector: 'h1' }),
        ).toBeInTheDocument();
    });

    it('usa email como fallback quando username estiver vazio', () => {
        useAuthMocked.mockReturnValue(
            createAuthMock({
                user: {
                    ...baseUser,
                    username: '',
                    email: 'only-email@example.com',
                },
                isAuthenticated: true,
            }),
        );

        renderDashboard();

        expect(
            screen.getByText(/Olá, only-email@example.com!/, { selector: 'h1' }),
        ).toBeInTheDocument();
    });

    it('usa "Trader" como fallback quando não houver usuário', () => {
        useAuthMocked.mockReturnValue(
            createAuthMock({
                user: null,
                isAuthenticated: false,
            }),
        );

        renderDashboard();

        expect(
            screen.getByText(/Olá, Trader!/, { selector: 'h1' }),
        ).toBeInTheDocument();
    });

    it('mostra métricas quando estatísticas estão disponíveis', () => {
        const stats: SimulationStats = {
            totalSimulations: 10,
            winRate: '60%',
            avgReturn: '15%',
            simulatedCapital: 12345.67,
        };

        useSimulationStatisticsMocked.mockReturnValue({
            data: stats,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useSimulationStatistics>);

        renderDashboard();

        const getMetricCard = (label: string): HTMLElement => {
            const labelElement = screen.getByText(label);
            const cardElement = labelElement.closest('.ts-glass-surface');

            expect(cardElement).not.toBeNull();

            if (!cardElement || !(cardElement instanceof HTMLElement)) {
                throw new Error(`Elemento de card não é um HTMLElement para label "${label}"`);
            }

            return cardElement;
        };

        const totalCard = getMetricCard('Simulações totais');
        expect(within(totalCard).getByText('10')).toBeInTheDocument();

        const roiCard = getMetricCard('ROI médio');
        expect(within(roiCard).getByText('15%')).toBeInTheDocument();

        const winRateCard = getMetricCard('Taxa de acerto');
        expect(within(winRateCard).getByText('60%')).toBeInTheDocument();

        const capitalCard = getMetricCard('Capital simulado');
        const capitalTextElement = within(capitalCard).getByText(
            (content) => content.includes('R$') && content.includes('12.345,67'),
        );
        expect(capitalTextElement).toBeInTheDocument();
    });


    it('mostra mensagem de "Carregando simulações..." quando isLoadingSimulations for verdadeiro', () => {
        useRecentSimulationsMocked.mockReturnValue({
            data: [],
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useRecentSimulations>);

        renderDashboard();

        expect(
            screen.getByText('Carregando simulações...'),
        ).toBeInTheDocument();
    });

    it('mostra mensagem de erro quando não for possível carregar as simulações', () => {
        useRecentSimulationsMocked.mockReturnValue({
            data: [],
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useRecentSimulations>);

        renderDashboard();

        expect(
            screen.getByText('Não foi possível carregar as simulações.'),
        ).toBeInTheDocument();
    });

    it('mostra mensagem de vazio quando não existir nenhuma simulação', () => {
        useRecentSimulationsMocked.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useRecentSimulations>);

        renderDashboard();

        expect(
            screen.getByText(
                'Você ainda não possui simulações registradas. Que tal criar a primeira?',
            ),
        ).toBeInTheDocument();
    });

    it('lista as simulações recentes com formatação de retorno e fallback "sem resultado"', () => {
        const now = new Date();

        const recentSimulations: RecentSimulation[] = [
            {
                id: 'sim-1',
                simulationName: 'Simulação Positiva',
                assetSymbol: 'PETR4',
                createdAt: now.toISOString(),
                returnPercentage: 10.25,
            },
            {
                id: 'sim-2',
                simulationName: 'Simulação Negativa',
                assetSymbol: 'VALE3',
                createdAt: now.toISOString(),
                returnPercentage: -3.4,
            },
            {
                id: 'sim-3',
                simulationName: 'Simulação Sem Resultado',
                assetSymbol: 'ABCD3',
                createdAt: now.toISOString(),
                returnPercentage: null,
            },
        ];

        useRecentSimulationsMocked.mockReturnValue({
            data: recentSimulations,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useRecentSimulations>);

        renderDashboard();

        expect(
            screen.getByText('Simulação Positiva'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Simulação Negativa'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Simulação Sem Resultado'),
        ).toBeInTheDocument();

        const positiveReturn = screen.getByText('+10.3%');
        expect(positiveReturn).toBeInTheDocument();
        expect(positiveReturn.className).toContain('text-emerald-500');

        const negativeReturn = screen.getByText('-3.4%');
        expect(negativeReturn).toBeInTheDocument();
        expect(negativeReturn.className).toContain('text-red-500');

        expect(
            screen.getByText('sem resultado'),
        ).toBeInTheDocument();
    });

    it('passa corretamente experienceLevel, winRate e avgReturn para SuggestedStrategiesCard', () => {
        const stats: SimulationStats = {
            totalSimulations: 5,
            winRate: '72%',
            avgReturn: '18%',
            simulatedCapital: 5000,
        };

        const userWithLevel: ExperienceLevel = 'INTERMEDIATE';

        useAuthMocked.mockReturnValue(
            createAuthMock({
                user: {
                    ...baseUser,
                    experienceLevel: userWithLevel,
                },
                isAuthenticated: true,
            }),
        );

        useSimulationStatisticsMocked.mockReturnValue({
            data: stats,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useSimulationStatistics>);

        renderDashboard();

        const card = screen.getByTestId('suggested-strategies-card');
        const text = card.textContent ?? '';

        expect(text).toContain('level:INTERMEDIATE');
        expect(text).toContain('winRate:72%');
        expect(text).toContain('avgReturn:18%');
    });
});