import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { SuggestedStrategiesCard } from '@/components/dashboard/SuggestedStrategiesCard';
import { renderWithProviders } from '../test-utils';
import * as recommender from '@/utils/strategyRecommender';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/utils/strategyRecommender', () => ({
    getExperienceLabel: vi.fn((level) => `Nível ${level}`),
    inferUserRiskProfile: vi.fn(() => 'MEDIUM'),
    getSuggestedStrategies: vi.fn(() => [
        {
            name: 'Estratégia Mock 1',
            bias: 'Bullish',
            description: 'Descrição da Estratégia 1',
            minLevel: 'NOVICE',
            risk: 'LOW',
            tags: ['Opções', 'Spread'],
        },
        {
            name: 'Estratégia Mock 2',
            bias: 'Bearish',
            description: 'Descrição da Estratégia 2',
            minLevel: 'INTERMEDIATE',
            risk: 'HIGH',
            tags: ['Futuros'],
        },
    ]),
}));

const renderWithRouter = (ui: React.ReactElement) =>
    renderWithProviders(<MemoryRouter>{ui}</MemoryRouter>);

describe('Componente SuggestedStrategiesCard', () => {
    const defaultProps = {
        experienceLevel: 'INTERMEDIATE' as recommender.ExperienceLevel,
        winRate: '60%',
        avgReturn: '15%',
    };

    it('deve renderizar o título e descrição baseada no nível', () => {
        renderWithRouter(<SuggestedStrategiesCard {...defaultProps} />);
        expect(screen.getByText('Estratégias sugeridas')).toBeInTheDocument();
        expect(screen.getAllByText(/Nível INTERMEDIATE/)[0]).toBeInTheDocument();
        expect(screen.getByText(/moderado/)).toBeInTheDocument();
    });

    it('deve renderizar a lista', () => {
        renderWithRouter(<SuggestedStrategiesCard {...defaultProps} />);

        expect(screen.getByText('Estratégia Mock 1')).toBeInTheDocument();
        expect(screen.getByText('Estratégia Mock 2')).toBeInTheDocument();
    });

    it('deve renderizar os badges', () => {
        renderWithRouter(<SuggestedStrategiesCard {...defaultProps} />);
        expect(screen.getByText('Opções')).toBeInTheDocument();
        expect(screen.getByText('Spread')).toBeInTheDocument();
        expect(screen.getByText('Futuros')).toBeInTheDocument();
    });

    it('deve renderizar o link para explorar estratégias', () => {
        renderWithRouter(<SuggestedStrategiesCard {...defaultProps} />);
        const link = screen.getByText('Explorar todas as estratégias');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/strategies');
    });

    it('deve chamar funções utilitárias corretamente', () => {
        const riskSpy = vi.spyOn(recommender, 'inferUserRiskProfile');
        const suggestSpy = vi.spyOn(recommender, 'getSuggestedStrategies');

        renderWithRouter(<SuggestedStrategiesCard {...defaultProps} />);

        expect(riskSpy).toHaveBeenCalledWith('60%', '15%');
        expect(suggestSpy).toHaveBeenCalledWith('INTERMEDIATE', 'MEDIUM');
    });
});
