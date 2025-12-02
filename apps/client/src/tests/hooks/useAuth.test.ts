import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '../test-utils';
import { useAuth } from '@/hooks/useAuth';
import * as apiService from '@/services/api';

vi.mock('@/services/api', () => ({
    apiService: {
        getCurrentUser: vi.fn(),
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
    },
}));

type ApiServiceType = typeof apiService.apiService;
type GetCurrentUserReturn = ReturnType<ApiServiceType['getCurrentUser']>;
type GetCurrentUserResolved = Awaited<GetCurrentUserReturn>;
type LoginResolved = Awaited<ReturnType<ApiServiceType['login']>>;
type RegisterResolved = Awaited<ReturnType<ApiServiceType['register']>>;
type LogoutResolved = Awaited<ReturnType<ApiServiceType['logout']>>;

describe('useAuth', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('Estado Inicial', () => {
        it('deve inicializar com usuário nulo e loading true quando existir token e a requisição estiver pendente', () => {
            localStorage.setItem('accessToken', 'token-facelift');

            const promessaNuncaResolvida =
                new Promise<never>(() => { }) as unknown as GetCurrentUserReturn;

            vi.mocked(apiService.apiService.getCurrentUser).mockReturnValue(
                promessaNuncaResolvida
            );

            const { result: resultado } = renderHookWithProviders(() => useAuth());

            expect(resultado.current.user).toBeNull();
            expect(resultado.current.loading).toBe(true);
            expect(resultado.current.error).toBeNull();
            expect(resultado.current.isAuthenticated).toBe(false);
        });

        it('deve verificar autenticação no mount quando existir token', async () => {
            const usuarioMock = {
                id: '1',
                username: 'layneStaley',
                email: 'layne.staley@grunge.com',
                experienceLevel: 'NOVICE',
                createdAt: '1990-08-21',
                updatedAt: '1992-09-29',
            };

            localStorage.setItem('accessToken', 'token-dirt');

            vi.mocked(apiService.apiService.getCurrentUser).mockResolvedValueOnce(
                {
                    data: usuarioMock,
                } as unknown as GetCurrentUserResolved
            );

            const { result: resultado } = renderHookWithProviders(() => useAuth());

            await waitFor(() => {
                expect(resultado.current.loading).toBe(false);
            });

            expect(resultado.current.user).toEqual(usuarioMock);
            expect(resultado.current.isAuthenticated).toBe(true);
        });

        it('deve definir loading como false quando não existir token', async () => {
            const { result: resultado } = renderHookWithProviders(() => useAuth());

            await waitFor(() => {
                expect(resultado.current.loading).toBe(false);
            });

            expect(resultado.current.user).toBeNull();
        });
    });

    describe('Login', () => {
        it('deve realizar login com sucesso', async () => {
            const usuarioMock = {
                id: '1',
                username: 'layneStaley',
                email: 'layne.staley@grunge.com',
                experienceLevel: 'iniciante',
                createdAt: '1990-08-21',
                updatedAt: '1992-09-29',
            };

            vi.mocked(apiService.apiService.login).mockResolvedValueOnce(
                {
                    data: {
                        user: usuarioMock,
                        accessToken: 'token-facelift-access',
                        refreshToken: 'token-dirt-refresh',
                    },
                } as unknown as LoginResolved
            );

            const { result: resultado } = renderHookWithProviders(() => useAuth());

            let resultadoLogin: unknown;
            await act(async () => {
                resultadoLogin = await resultado.current.login(
                    'layne.staley@grunge.com',
                    'senha-man-in-the-box'
                );
            });

            expect(resultadoLogin).toEqual(usuarioMock);
            expect(resultado.current.user).toEqual(usuarioMock);
            expect(resultado.current.isAuthenticated).toBe(true);
            expect(localStorage.getItem('accessToken')).toBe('token-facelift-access');
            expect(localStorage.getItem('refreshToken')).toBe('token-dirt-refresh');
        });

        it('deve tratar erro de login', async () => {
            const mensagemErro = 'Credenciais inválidas para acessar "Dirt"';

            vi.mocked(apiService.apiService.login).mockRejectedValueOnce({
                response: { data: { message: mensagemErro } },
                isAxiosError: true,
            });

            const { result: resultado } = renderHookWithProviders(() => useAuth());

            await act(async () => {
                try {
                    await resultado.current.login(
                        'layne.staley@grunge.com',
                        'senha-errada-rooster'
                    );
                } catch (error: unknown) {
                    // Apenas garantimos que o erro realmente ocorreu
                    expect(error).toBeDefined();
                }
            });

            expect(resultado.current.error).toBe(mensagemErro);
            expect(resultado.current.user).toBeNull();
            expect(resultado.current.isAuthenticated).toBe(false);
        });
    });

    describe('Cadastro', () => {
        it('deve realizar cadastro com sucesso', async () => {
            const usuarioMock = {
                id: '2',
                username: 'jerryCantrell',
                email: 'jerry.cantrell@aliceinchains.com',
                experienceLevel: 'intermediario',
                createdAt: '1995-11-07',
                updatedAt: '2009-09-29',
            };

            vi.mocked(apiService.apiService.register).mockResolvedValueOnce(
                {
                    data: {
                        user: usuarioMock,
                        accessToken: 'token-black-gives-way-to-blue-access',
                        refreshToken: 'token-jar-of-flies-refresh',
                    },
                } as unknown as RegisterResolved
            );

            const { result: resultado } = renderHookWithProviders(() => useAuth());

            let resultadoCadastro: unknown;
            await act(async () => {
                resultadoCadastro = await resultado.current.register(
                    'jerryCantrell',
                    'jerry.cantrell@aliceinchains.com',
                    'senha-rooster',
                    'intermediario'
                );
            });

            expect(resultadoCadastro).toEqual(usuarioMock);
            expect(resultado.current.user).toEqual(usuarioMock);
            expect(resultado.current.isAuthenticated).toBe(true);
            expect(localStorage.getItem('accessToken')).toBe(
                'token-black-gives-way-to-blue-access'
            );
        });

        it('deve tratar erro de cadastro', async () => {
            const mensagemErro = 'E-mail de Jerry já cadastrado em "Facelift"';

            vi.mocked(apiService.apiService.register).mockRejectedValueOnce({
                response: { data: { message: mensagemErro } },
                isAxiosError: true,
            });

            const { result: resultado } = renderHookWithProviders(() => useAuth());

            await act(async () => {
                try {
                    await resultado.current.register(
                        'jerryCantrell',
                        'jerry.cantrell@aliceinchains.com',
                        'senha-would'
                    );
                } catch (error: unknown) {
                    expect(error).toBeDefined();
                }
            });

            expect(resultado.current.error).toBe(mensagemErro);
        });
    });

    describe('Logout', () => {
        it('deve realizar logout com sucesso', async () => {
            const usuarioMock = {
                id: '1',
                username: 'layneStaley',
                email: 'layne.staley@grunge.com',
                experienceLevel: 'iniciante',
                createdAt: '1990-08-21',
                updatedAt: '1992-09-29',
            };

            vi.mocked(apiService.apiService.login).mockResolvedValueOnce(
                {
                    data: {
                        user: usuarioMock,
                        accessToken: 'token-black-gives-way-to-blue',
                        refreshToken: 'token-unplugged-refresh',
                    },
                } as unknown as LoginResolved
            );

            vi.mocked(apiService.apiService.logout).mockResolvedValueOnce(
                {} as unknown as LogoutResolved
            );

            const { result: resultado } = renderHookWithProviders(() => useAuth());

            await act(async () => {
                await resultado.current.login(
                    'layne.staley@grunge.com',
                    'senha-nutshell'
                );
            });

            expect(resultado.current.user).toEqual(usuarioMock);
            expect(resultado.current.isAuthenticated).toBe(true);
            expect(localStorage.getItem('accessToken')).toBe(
                'token-black-gives-way-to-blue'
            );
            expect(localStorage.getItem('refreshToken')).toBe(
                'token-unplugged-refresh'
            );

            await act(async () => {
                await resultado.current.logout();
            });

            expect(localStorage.getItem('accessToken')).toBeNull();
            expect(localStorage.getItem('refreshToken')).toBeNull();
            expect(resultado.current.user).toBeNull();
            expect(resultado.current.isAuthenticated).toBe(false);
        });

        it('deve tratar erro de logout graciosamente', async () => {
            localStorage.setItem('accessToken', 'token-unplugged');

            vi.mocked(apiService.apiService.logout).mockRejectedValueOnce(
                new Error('Erro de rede em "MTV Unplugged"')
            );

            const { result: resultado } = renderHookWithProviders(() => useAuth());

            await act(async () => {
                await resultado.current.logout();
            });

            expect(localStorage.getItem('accessToken')).toBeNull();
            expect(resultado.current.user).toBeNull();
        });
    });

    describe('Estado de Carregamento', () => {
        it('deve definir loading como false após login', async () => {
            vi.mocked(apiService.apiService.login).mockResolvedValueOnce(
                {
                    data: {
                        user: {
                            id: '3',
                            username: 'seanKinney',
                            email: 'sean.kinney@aliceinchains.com',
                            experienceLevel: 'avancado',
                            createdAt: '1990-08-21',
                            updatedAt: '1995-11-07',
                        },
                        accessToken: 'token-sean-kinney-access',
                    },
                } as unknown as LoginResolved
            );

            const { result: resultado } = renderHookWithProviders(() => useAuth());

            await act(async () => {
                await resultado.current.login(
                    'sean.kinney@aliceinchains.com',
                    'senha-them-bones'
                );
            });

            expect(resultado.current.loading).toBe(false);
        });
    });
});