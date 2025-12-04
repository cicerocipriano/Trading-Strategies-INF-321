import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import Layout from '@/components/Layout';
import { renderWithProviders } from '../test-utils';
import { useAuth } from '@/hooks/useAuth';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

import { createAuthMock } from '../mocks/authMocks';

type UseAuthReturn = ReturnType<typeof useAuth>;
const useAuthMockado = vi.mocked(useAuth) as ReturnType<typeof vi.mocked<typeof useAuth>>;

describe('Componente Layout', () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockLogout.mockReset();
    });

    it('deve renderizar o conteúdo filho', () => {
        const authMock: UseAuthReturn = createAuthMock({
            logout: mockLogout,
        });

        useAuthMockado.mockReturnValue(authMock);

        renderWithProviders(
            <MemoryRouter>
                <Layout>
                    <div>Conteúdo Filho</div>
                </Layout>
            </MemoryRouter>
        );

        expect(screen.getByText('Conteúdo Filho')).toBeInTheDocument();
    });

    it('deve renderizar os links de navegação principais', () => {
        useAuthMockado.mockReturnValue(
            createAuthMock({
                logout: mockLogout,
            })
        );

        renderWithProviders(
            <MemoryRouter>
                <Layout>
                    <div></div>
                </Layout>
            </MemoryRouter>
        );

        expect(screen.getByText('Estratégias')).toBeInTheDocument();
        expect(screen.getByText('Simulador')).toBeInTheDocument();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('deve renderizar o menu do usuário quando autenticado', () => {
        const user = {
            id: '1',
            username: 'testuser',
            email: 'test@test.com',
            experienceLevel: 'NOVICE',
            createdAt: '',
            updatedAt: '',
        };

        useAuthMockado.mockReturnValue(
            createAuthMock({
                user,
                isAuthenticated: true,
                logout: mockLogout,
            })
        );

        renderWithProviders(
            <MemoryRouter>
                <Layout>
                    <div></div>
                </Layout>
            </MemoryRouter>
        );

        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText('Sair')).toBeInTheDocument();
    });

    it('não deve renderizar o menu do usuário quando não autenticado', () => {
        useAuthMockado.mockReturnValue(
            createAuthMock({
                logout: mockLogout,
            })
        );

        renderWithProviders(
            <MemoryRouter>
                <Layout>
                    <div></div>
                </Layout>
            </MemoryRouter>
        );

        expect(screen.queryByText('Sair')).not.toBeInTheDocument();
    });

    it('deve chamar a função de logout ao clicar em "Sair"', () => {
        const user = {
            id: '1',
            username: 'testuser',
            email: 'test@test.com',
            experienceLevel: 'NOVICE',
            createdAt: '',
            updatedAt: '',
        };

        useAuthMockado.mockReturnValue(
            createAuthMock({
                user,
                isAuthenticated: true,
                logout: mockLogout,
            })
        );

        renderWithProviders(
            <MemoryRouter>
                <Layout>
                    <div></div>
                </Layout>
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('Sair'));
        expect(mockLogout).toHaveBeenCalled();
    });
});