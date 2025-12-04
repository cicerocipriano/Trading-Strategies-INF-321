import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { renderWithProviders } from '../test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';

type UseAuthReturn = ReturnType<typeof useAuth>;
const useAuthMockado = vi.mocked(useAuth);

describe('Componente ProtectedRoute', () => {
    const ComponenteDeTeste = () => <div>Conteúdo Protegido</div>;

    const createAuthMock = (
        overrides: Partial<UseAuthReturn> = {}
    ): UseAuthReturn =>
    ({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        ...overrides,
    } as unknown as UseAuthReturn);

    const renderProtected = (
        authOverrides: Partial<UseAuthReturn> = {},
        protectedElement = <ComponenteDeTeste />
    ) => {
        const authMock = createAuthMock(authOverrides);
        useAuthMockado.mockReturnValue(authMock);

        return renderWithProviders(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route
                        path="/protected"
                        element={
                            <ProtectedRoute>
                                {protectedElement}
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/" element={<div>Página de Login</div>} />
                </Routes>
            </MemoryRouter>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Usuário Autenticado', () => {
        it('deve renderizar o componente quando o usuário estiver autenticado', async () => {
            renderProtected({
                user: {
                    id: '1',
                    username: 'eddieVedder',
                    email: 'eddie.vedder@pearljam.com',
                    experienceLevel: 'NOVICE',
                    createdAt: '2025-01-01T00:00:00.000Z',
                    updatedAt: '2025-01-01T00:00:00.000Z',
                },
                isAuthenticated: true,
            });

            await waitFor(() => {
                expect(
                    screen.getByText('Conteúdo Protegido')
                ).toBeInTheDocument();
            });
        });
    });

    describe('Usuário Não Autenticado', () => {
        it('deve redirecionar para login quando o usuário não estiver autenticado', async () => {
            renderProtected({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: null,
            });

            await waitFor(() => {
                expect(
                    screen.queryByText('Conteúdo Protegido')
                ).not.toBeInTheDocument();
                expect(screen.getByText('Página de Login')).toBeInTheDocument();
            });
        });
    });

    describe('Estado de Carregamento', () => {
        it('não deve renderizar nada enquanto o loading for true', () => {
            renderProtected({
                loading: true,
            });

            expect(
                screen.queryByText('Conteúdo Protegido')
            ).not.toBeInTheDocument();
            expect(screen.queryByText('Página de Login')).not.toBeInTheDocument();
        });

        it('deve renderizar o componente após o loading se estiver autenticado', async () => {
            renderProtected({
                user: {
                    id: '1',
                    username: 'stoneGossard',
                    email: 'stone.gossard@pearljam.com',
                } as any,
                isAuthenticated: true,
                loading: false,
            });

            await waitFor(() => {
                expect(
                    screen.getByText('Conteúdo Protegido')
                ).toBeInTheDocument();
            });
        });
    });

    describe('Tratamento de Erros', () => {
        it('deve redirecionar para login se houver erro de autenticação e não estiver autenticado', async () => {
            renderProtected({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: 'Falha de autenticação no show de "Alive"',
            });

            await waitFor(() => {
                expect(
                    screen.queryByText('Conteúdo Protegido')
                ).not.toBeInTheDocument();
                expect(screen.getByText('Página de Login')).toBeInTheDocument();
            });
        });
    });

    describe('Propriedades do Componente', () => {
        it('deve repassar as propriedades corretamente para o componente protegido', async () => {
            const ComponenteComProps = ({ titulo }: { titulo: string }) => (
                <div>{titulo}</div>
            );

            renderProtected(
                {
                    user: {
                        id: '1',
                        username: 'mikeMcCready',
                        email: 'mike.mccready@pearljam.com',
                        experienceLevel: 'NOVICE',
                        createdAt: '2025-01-01T00:00:00.000Z',
                        updatedAt: '2025-01-01T00:00:00.000Z',
                    },
                    isAuthenticated: true,
                    loading: false,
                },
                <ComponenteComProps titulo="Título de Teste" />
            );

            await waitFor(() => {
                expect(
                    screen.getByText('Título de Teste')
                ).toBeInTheDocument();
            });
        });
    });
});