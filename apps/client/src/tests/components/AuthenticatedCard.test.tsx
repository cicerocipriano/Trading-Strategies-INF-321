import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { AuthenticatedCard } from '@/components/home/AuthenticatedCard';
import { renderWithProviders } from '../test-utils';

describe('Componente AuthenticatedCard', () => {
    const mockOnGoDashboard = vi.fn();
    const mockOnLogout = vi.fn();
    const defaultProps = {
        userDisplayName: 'Neo',
        onGoDashboard: mockOnGoDashboard,
        onLogout: mockOnLogout,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar a mensagem de boas-vindas com o nome do usuário', () => {
        renderWithProviders(<AuthenticatedCard {...defaultProps} />);
        expect(screen.getByText('Olá, Neo 👋')).toBeInTheDocument();
    });

    it('deve renderizar o botão "Ir para o Dashboard"', () => {
        renderWithProviders(<AuthenticatedCard {...defaultProps} />);
        expect(screen.getByText('Ir para o Dashboard')).toBeInTheDocument();
    });

    it('deve chamar onGoDashboard ao clicar no botão do Dashboard', () => {
        renderWithProviders(<AuthenticatedCard {...defaultProps} />);
        fireEvent.click(screen.getByText('Ir para o Dashboard'));
        expect(mockOnGoDashboard).toHaveBeenCalledTimes(1);
    });

    it('deve renderizar o botão "Sair da conta"', () => {
        renderWithProviders(<AuthenticatedCard {...defaultProps} />);
        expect(screen.getByText('Sair da conta')).toBeInTheDocument();
    });

    it('deve chamar onLogout ao clicar no botão de Sair', () => {
        renderWithProviders(<AuthenticatedCard {...defaultProps} />);
        fireEvent.click(screen.getByText('Sair da conta'));
        expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });
});