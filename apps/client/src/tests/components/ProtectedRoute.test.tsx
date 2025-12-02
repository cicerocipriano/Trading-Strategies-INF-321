import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { renderWithProviders } from '../test-utils';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';

type UseAuthReturn = ReturnType<typeof useAuth>;

const useAuthMockado = vi.mocked(useAuth);

describe('Componente ProtectedRoute', () => {
    const ComponenteDeTeste = () => <div>Conteúdo Protegido - Ten</div>;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Usuário Autenticado', () => {
        it('deve renderizar o componente quando o usuário estiver autenticado', async () => {
            useAuthMockado.mockReturnValue({
                user: {
                    id: '1',
                    username: 'eddieVedder',
                    email: 'eddie.vedder@pearljam.com',
                },
                isAuthenticated: true,
                loading: false,
                error: null,
                login: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
            } as unknown as UseAuthReturn);

            renderWithProviders(
                <BrowserRouter>
                    <ProtectedRoute isAuthenticated={useAuthMockado().isAuthenticated}>
                        <ComponenteDeTeste />
                    </ProtectedRoute>
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(
                    screen.getByText('Conteúdo Protegido - Ten')
                ).toBeInTheDocument();
            });
        });
    });

    describe('Usuário Não Autenticado', () => {
        it('deve redirecionar para login quando o usuário não estiver autenticado', async () => {
            useAuthMockado.mockReturnValue({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: null,
                login: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
            } as unknown as UseAuthReturn);

            renderWithProviders(
                <BrowserRouter>
                    <ProtectedRoute isAuthenticated={useAuthMockado().isAuthenticated}>
                        <ComponenteDeTeste />
                    </ProtectedRoute>
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(
                    screen.queryByText('Conteúdo Protegido - Ten')
                ).not.toBeInTheDocument();
            });
        });
    });

    describe('Estado de Carregamento', () => {
        it('deve ocultar o conteúdo enquanto verifica autenticação', () => {
            useAuthMockado.mockReturnValue({
                user: null,
                isAuthenticated: false,
                loading: true,
                error: null,
                login: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
            } as unknown as UseAuthReturn);

            renderWithProviders(
                <BrowserRouter>
                    <ProtectedRoute isAuthenticated={useAuthMockado().isAuthenticated}>
                        <ComponenteDeTeste />
                    </ProtectedRoute>
                </BrowserRouter>
            );

            expect(
                screen.queryByText('Conteúdo Protegido - Ten')
            ).not.toBeInTheDocument();
        });

        it('deve renderizar o componente após o carregamento para usuário autenticado', async () => {
            useAuthMockado.mockReturnValue({
                user: {
                    id: '1',
                    username: 'stoneGossard',
                    email: 'stone.gossard@pearljam.com',
                },
                isAuthenticated: true,
                loading: false,
                error: null,
                login: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
            } as unknown as UseAuthReturn);

            renderWithProviders(
                <BrowserRouter>
                    <ProtectedRoute isAuthenticated={useAuthMockado().isAuthenticated}>
                        <ComponenteDeTeste />
                    </ProtectedRoute>
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(
                    screen.getByText('Conteúdo Protegido - Ten')
                ).toBeInTheDocument();
            });
        });
    });

    describe('Tratamento de Erros', () => {
        it('deve tratar erro de autenticação', async () => {
            useAuthMockado.mockReturnValue({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: 'Falha de autenticação no show de "Alive"',
                login: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
            } as unknown as UseAuthReturn);

            renderWithProviders(
                <BrowserRouter>
                    <ProtectedRoute isAuthenticated={useAuthMockado().isAuthenticated}>
                        <ComponenteDeTeste />
                    </ProtectedRoute>
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(
                    screen.queryByText('Conteúdo Protegido - Ten')
                ).not.toBeInTheDocument();
            });
        });
    });

    describe('Propriedades do Componente', () => {
        it('deve repassar as propriedades corretamente para o componente protegido', async () => {
            useAuthMockado.mockReturnValue({
                user: {
                    id: '1',
                    username: 'mikeMcCready',
                    email: 'mike.mccready@pearljam.com',
                },
                isAuthenticated: true,
                loading: false,
                error: null,
                login: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
            } as unknown as UseAuthReturn);

            const ComponenteComProps = ({ titulo }: { titulo: string }) => (
                <div>{titulo}</div>
            );

            renderWithProviders(
                <BrowserRouter>
                    <ProtectedRoute isAuthenticated={useAuthMockado().isAuthenticated}>
                        <ComponenteComProps titulo="Título de Teste - Even Flow" />
                    </ProtectedRoute>
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(
                    screen.getByText('Título de Teste - Even Flow')
                ).toBeInTheDocument();
            });
        });
    });
});