import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { StrategyCard } from '@/components/strategies/StrategyCard';
import { renderWithProviders } from '../test-utils';

interface MockLocation {
    href: string;
}

delete (window as Partial<typeof window>).location; // Remove a propriedade original
// Redefine a propriedade location com um mock
Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
        href: '',
        origin: 'http://localhost',
        protocol: 'http:',
        host: 'localhost',
        hostname: 'localhost',
        port: '',
        pathname: '/',
        search: '',
        hash: '',
        reload: vi.fn(),
        replace: vi.fn(),
        assign: vi.fn(),
    } as MockLocation,
});

describe('Componente StrategyCard', () => {
    type StrategyCardProps = Parameters<typeof StrategyCard>[0];
    type Strategy = StrategyCardProps['strategy'];

    const estrategiaMock: Strategy = {
        id: '1',
        name: 'Black Hole Sun Spread',
        summary:
            'O conceito de estratégia, em grego strateegia, em latim strategi, em francês stratégie...',
        proficiencyLevel: 'intermediate',
        marketOutlook: 'bullish',
        volatilityView: 'low',
        riskProfile: 'medium',
        rewardProfile: 'medium',
        strategyType: 'vertical_spread',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        window.location.href = '';
    });

    describe('Renderização', () => {
        it('deve renderizar o nome da estratégia', () => {
            renderWithProviders(<StrategyCard strategy={estrategiaMock} />);
            expect(
                screen.getByText('Black Hole Sun Spread')
            ).toBeInTheDocument();
        });

        it('deve renderizar o resumo da estratégia', () => {
            renderWithProviders(<StrategyCard strategy={estrategiaMock} />);
            expect(
                screen.getByText(
                    'O conceito de estratégia, em grego strateegia, em latim strategi, em francês stratégie...'
                )
            ).toBeInTheDocument();
        });

        it('deve renderizar o badge de nível de proficiência', () => {
            renderWithProviders(<StrategyCard strategy={estrategiaMock} />);
            const badges = screen.getAllByText(/intermediate|Intermediário/i);
            expect(badges.length).toBeGreaterThan(0);
        });

        it('deve renderizar o badge de visão de mercado', () => {
            renderWithProviders(<StrategyCard strategy={estrategiaMock} />);
            const badges = screen.getAllByText(/bullish|Altista/i);
            expect(badges.length).toBeGreaterThan(0);
        });

        it('deve renderizar os botões de ação', () => {
            renderWithProviders(<StrategyCard strategy={estrategiaMock} />);
            expect(screen.getByText('Ver detalhes')).toBeInTheDocument();
            expect(screen.getByText('Simular')).toBeInTheDocument();
        });

        it('deve lidar graciosamente com campos opcionais ausentes', () => {
            const estrategiaMinima: Strategy = {
                id: '2',
                name: 'Superunknown Strategy',
            };

            renderWithProviders(<StrategyCard strategy={estrategiaMinima} />);
            expect(
                screen.getByText('Superunknown Strategy')
            ).toBeInTheDocument();
            expect(screen.getByText('Ver detalhes')).toBeInTheDocument();
        });
    });

    describe('Navegação', () => {
        it('deve navegar para os detalhes da estratégia ao clicar em "Ver detalhes"', () => {
            renderWithProviders(<StrategyCard strategy={estrategiaMock} />);

            const botaoDetalhes = screen.getByText('Ver detalhes');
            fireEvent.click(botaoDetalhes);

            expect(window.location.href).toBe('/strategies/1');
        });

        it('deve navegar com o ID correto da estratégia', () => {
            const estrategiaComIdDiferente: Strategy = {
                ...estrategiaMock,
                id: '123',
            };
            renderWithProviders(
                <StrategyCard strategy={estrategiaComIdDiferente} />
            );

            const botaoDetalhes = screen.getByText('Ver detalhes');
            fireEvent.click(botaoDetalhes);

            expect(window.location.href).toBe('/strategies/123');
        });
    });

    describe('Botão de Simulação', () => {
        it('deve tratar o clique no botão de simulação', () => {
            const espiaConsole = vi.spyOn(console, 'log');
            renderWithProviders(<StrategyCard strategy={estrategiaMock} />);

            const botaoSimular = screen.getByText('Simular');
            fireEvent.click(botaoSimular);

            expect(espiaConsole).toHaveBeenCalledWith(
                'Simular estratégia',
                '1'
            );
        });

        it('deve logar o ID correto da estratégia ao simular', () => {
            const espiaConsole = vi.spyOn(console, 'log');
            const estrategiaComOutroId: Strategy = {
                ...estrategiaMock,
                id: '456',
            };

            renderWithProviders(
                <StrategyCard strategy={estrategiaComOutroId} />
            );

            const botaoSimular = screen.getByText('Simular');
            fireEvent.click(botaoSimular);

            expect(espiaConsole).toHaveBeenCalledWith(
                'Simular estratégia',
                '456'
            );
        });
    });

    describe('Estilo e Exibição', () => {
        it('deve aplicar as classes CSS corretas', () => {
            const { container } = renderWithProviders(
                <StrategyCard strategy={estrategiaMock} />
            );
            const card = container.querySelector('.ts-glass-surface');
            expect(card).toBeInTheDocument();
            expect(card).toHaveClass('ts-glass-hover-lift');
            expect(card).toHaveClass('rounded-2xl');
            expect(card).toHaveClass('p-6');
        });

        it('deve exibir todos os badges quando todos os campos estiverem presentes', () => {
            const { container } = renderWithProviders(
                <StrategyCard strategy={estrategiaMock} />
            );
            const badges = container.querySelectorAll('span.inline-flex');
            expect(badges.length).toBeGreaterThan(1);
        });

        it('deve truncar resumos muito longos', () => {
            const resumoLongoSoundgarden = 'A'.repeat(500);
            const estrategiaComResumoLongo: Strategy = {
                ...estrategiaMock,
                summary: resumoLongoSoundgarden,
            };

            const { container } = renderWithProviders(
                <StrategyCard strategy={estrategiaComResumoLongo} />
            );

            const elementoResumo = container.querySelector('p.line-clamp-3');
            expect(elementoResumo).toBeInTheDocument();
        });
    });

    describe('Casos Limite', () => {
        it('deve lidar com ID numérico', () => {
            const estrategiaComIdNumerico: Strategy = {
                ...estrategiaMock,
                id: 999,
            };
            renderWithProviders(
                <StrategyCard strategy={estrategiaComIdNumerico} />
            );

            const botaoDetalhes = screen.getByText('Ver detalhes');
            fireEvent.click(botaoDetalhes);

            expect(window.location.href).toBe('/strategies/999');
        });

        it('deve lidar com resumo vazio', () => {
            const estrategiaComResumoVazio: Strategy = {
                ...estrategiaMock,
                summary: '',
            };
            renderWithProviders(
                <StrategyCard strategy={estrategiaComResumoVazio} />
            );

            expect(
                screen.getByText('Black Hole Sun Spread')
            ).toBeInTheDocument();
            expect(screen.getByText('Ver detalhes')).toBeInTheDocument();
        });

        it('deve lidar com valores nulos em campos opcionais', () => {
            const estrategiaComCamposNulos: Strategy = {
                ...estrategiaMock,
                proficiencyLevel: null,
                marketOutlook: null,
                volatilityView: null,
            };

            renderWithProviders(
                <StrategyCard strategy={estrategiaComCamposNulos} />
            );
            expect(
                screen.getByText('Black Hole Sun Spread')
            ).toBeInTheDocument();
        });
    });
});