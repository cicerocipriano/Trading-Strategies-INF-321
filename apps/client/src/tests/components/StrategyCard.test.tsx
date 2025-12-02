import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { StrategyCard } from '@/components/strategies/StrategyCard';
import { renderWithProviders } from '../test-utils';

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

describe('StrategyCard', () => {
    const mockStrategy = {
        id: '1',
        name: 'Bull Call Spread',
        summary: 'A bullish strategy with limited profit and loss',
        proficiencyLevel: 'intermediate',
        marketOutlook: 'bullish',
        volatilityView: 'low',
        riskProfile: 'medium',
        rewardProfile: 'medium',
        strategyType: 'vertical_spread',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render strategy name', () => {
            renderWithProviders(<StrategyCard strategy={mockStrategy} />);
            expect(screen.getByText('Bull Call Spread')).toBeInTheDocument();
        });

        it('should render strategy summary', () => {
            renderWithProviders(<StrategyCard strategy={mockStrategy} />);
            expect(screen.getByText('A bullish strategy with limited profit and loss')).toBeInTheDocument();
        });

        it('should render proficiency level badge', () => {
            renderWithProviders(<StrategyCard strategy={mockStrategy} />);
            const badges = screen.getAllByText(/intermediate|Intermediário/i);
            expect(badges.length).toBeGreaterThan(0);
        });

        it('should render market outlook badge', () => {
            renderWithProviders(<StrategyCard strategy={mockStrategy} />);
            const badges = screen.getAllByText(/bullish|Altista/i);
            expect(badges.length).toBeGreaterThan(0);
        });

        it('should render action buttons', () => {
            renderWithProviders(<StrategyCard strategy={mockStrategy} />);
            expect(screen.getByText('Ver detalhes')).toBeInTheDocument();
            expect(screen.getByText('Simular')).toBeInTheDocument();
        });

        it('should handle missing optional fields gracefully', () => {
            const minimalStrategy = {
                id: '2',
                name: 'Simple Strategy',
            };

            renderWithProviders(<StrategyCard strategy={minimalStrategy as any} />);
            expect(screen.getByText('Simple Strategy')).toBeInTheDocument();
            expect(screen.getByText('Ver detalhes')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should navigate to strategy details on "Ver detalhes" click', () => {
            renderWithProviders(<StrategyCard strategy={mockStrategy} />);

            const detailsButton = screen.getByText('Ver detalhes');
            fireEvent.click(detailsButton);

            expect(window.location.href).toBe('/strategies/1');
        });

        it('should navigate with correct strategy ID', () => {
            const strategyWithDifferentId = { ...mockStrategy, id: '123' };
            renderWithProviders(<StrategyCard strategy={strategyWithDifferentId} />);

            const detailsButton = screen.getByText('Ver detalhes');
            fireEvent.click(detailsButton);

            expect(window.location.href).toBe('/strategies/123');
        });
    });

    describe('Simulation Button', () => {
        it('should handle simulate button click', () => {
            const consoleSpy = vi.spyOn(console, 'log');
            renderWithProviders(<StrategyCard strategy={mockStrategy} />);

            const simulateButton = screen.getByText('Simular');
            fireEvent.click(simulateButton);

            expect(consoleSpy).toHaveBeenCalledWith('Simular estratégia', '1');
        });

        it('should log correct strategy ID on simulate', () => {
            const consoleSpy = vi.spyOn(console, 'log');
            const strategyWithDifferentId = { ...mockStrategy, id: '456' };

            renderWithProviders(<StrategyCard strategy={strategyWithDifferentId} />);

            const simulateButton = screen.getByText('Simular');
            fireEvent.click(simulateButton);

            expect(consoleSpy).toHaveBeenCalledWith('Simular estratégia', '456');
        });
    });

    describe('Styling and Display', () => {
        it('should apply correct CSS classes', () => {
            const { container } = renderWithProviders(<StrategyCard strategy={mockStrategy} />);
            const card = container.querySelector('.ts-glass-surface');
            expect(card).toBeInTheDocument();
            expect(card).toHaveClass('ts-glass-hover-lift');
            expect(card).toHaveClass('rounded-2xl');
            expect(card).toHaveClass('p-6');
        });

        it('should display all badges when all fields are present', () => {
            const { container } = renderWithProviders(<StrategyCard strategy={mockStrategy} />);
            const badges = container.querySelectorAll('span.inline-flex');
            // Should have multiple badges for different attributes
            expect(badges.length).toBeGreaterThan(1);
        });

        it('should truncate long summaries', () => {
            const longSummary = 'A'.repeat(500);
            const strategyWithLongSummary = {
                ...mockStrategy,
                summary: longSummary,
            };

            const { container } = renderWithProviders(
                <StrategyCard strategy={strategyWithLongSummary} />
            );

            const summaryElement = container.querySelector('p.line-clamp-3');
            expect(summaryElement).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle numeric ID', () => {
            const strategyWithNumericId = { ...mockStrategy, id: 999 };
            renderWithProviders(<StrategyCard strategy={strategyWithNumericId} />);

            const detailsButton = screen.getByText('Ver detalhes');
            fireEvent.click(detailsButton);

            expect(window.location.href).toBe('/strategies/999');
        });

        it('should handle empty summary', () => {
            const strategyWithEmptySummary = { ...mockStrategy, summary: '' };
            renderWithProviders(<StrategyCard strategy={strategyWithEmptySummary} />);

            expect(screen.getByText('Bull Call Spread')).toBeInTheDocument();
            expect(screen.getByText('Ver detalhes')).toBeInTheDocument();
        });

        it('should handle null values in optional fields', () => {
            const strategyWithNulls = {
                ...mockStrategy,
                proficiencyLevel: null,
                marketOutlook: null,
                volatilityView: null,
            };

            renderWithProviders(<StrategyCard strategy={strategyWithNulls} />);
            expect(screen.getByText('Bull Call Spread')).toBeInTheDocument();
        });
    });
});