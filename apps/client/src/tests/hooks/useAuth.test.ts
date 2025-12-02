import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import * as apiService from '@/services/api';

// Mock the API service
vi.mock('@/services/api', () => ({
    apiService: {
        getCurrentUser: vi.fn(),
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
    },
}));

describe('useAuth', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('Initial State', () => {
        it('should initialize with null user and loading true', () => {
            const { result } = renderHook(() => useAuth());

            expect(result.current.user).toBeNull();
            expect(result.current.loading).toBe(true);
            expect(result.current.error).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });

        it('should check auth on mount when token exists', async () => {
            const mockUser = {
                id: '1',
                username: 'testuser',
                email: 'test@example.com',
                experienceLevel: 'beginner',
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
            };

            localStorage.setItem('accessToken', 'test-token');
            vi.mocked(apiService.apiService.getCurrentUser).mockResolvedValueOnce({
                data: mockUser,
            } as any);

            const { result } = renderHook(() => useAuth());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user).toEqual(mockUser);
            expect(result.current.isAuthenticated).toBe(true);
        });

        it('should set loading to false when no token exists', async () => {
            const { result } = renderHook(() => useAuth());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user).toBeNull();
        });
    });

    describe('Login', () => {
        it('should login successfully', async () => {
            const mockUser = {
                id: '1',
                username: 'testuser',
                email: 'test@example.com',
                experienceLevel: 'beginner',
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
            };

            vi.mocked(apiService.apiService.login).mockResolvedValueOnce({
                data: {
                    user: mockUser,
                    accessToken: 'access-token',
                    refreshToken: 'refresh-token',
                },
            } as any);

            const { result } = renderHook(() => useAuth());

            let loginResult;
            await act(async () => {
                loginResult = await result.current.login('test@example.com', 'password');
            });

            expect(loginResult).toEqual(mockUser);
            expect(result.current.user).toEqual(mockUser);
            expect(result.current.isAuthenticated).toBe(true);
            expect(localStorage.getItem('accessToken')).toBe('access-token');
            expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
        });

        it('should handle login error', async () => {
            const errorMessage = 'Invalid credentials';
            vi.mocked(apiService.apiService.login).mockRejectedValueOnce({
                response: { data: { message: errorMessage } },
                isAxiosError: true,
            });

            const { result } = renderHook(() => useAuth());

            await act(async () => {
                try {
                    await result.current.login('test@example.com', 'wrong-password');
                } catch (error) {
                    // Expected error
                }
            });

            expect(result.current.error).toBe(errorMessage);
            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });
    });

    describe('Register', () => {
        it('should register successfully', async () => {
            const mockUser = {
                id: '1',
                username: 'newuser',
                email: 'new@example.com',
                experienceLevel: 'beginner',
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
            };

            vi.mocked(apiService.apiService.register).mockResolvedValueOnce({
                data: {
                    user: mockUser,
                    accessToken: 'access-token',
                    refreshToken: 'refresh-token',
                },
            } as any);

            const { result } = renderHook(() => useAuth());

            let registerResult;
            await act(async () => {
                registerResult = await result.current.register(
                    'newuser',
                    'new@example.com',
                    'password',
                    'beginner'
                );
            });

            expect(registerResult).toEqual(mockUser);
            expect(result.current.user).toEqual(mockUser);
            expect(result.current.isAuthenticated).toBe(true);
            expect(localStorage.getItem('accessToken')).toBe('access-token');
        });

        it('should handle register error', async () => {
            const errorMessage = 'Email already exists';
            vi.mocked(apiService.apiService.register).mockRejectedValueOnce({
                response: { data: { message: errorMessage } },
                isAxiosError: true,
            });

            const { result } = renderHook(() => useAuth());

            await act(async () => {
                try {
                    await result.current.register('user', 'existing@example.com', 'password');
                } catch (error) {
                    // Expected error
                }
            });

            expect(result.current.error).toBe(errorMessage);
        });
    });

    describe('Logout', () => {
        it('should logout successfully', async () => {
            const mockUser = {
                id: '1',
                username: 'testuser',
                email: 'test@example.com',
                experienceLevel: 'beginner',
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
            };

            localStorage.setItem('accessToken', 'test-token');
            localStorage.setItem('refreshToken', 'refresh-token');

            vi.mocked(apiService.apiService.logout).mockResolvedValueOnce({} as any);

            const { result } = renderHook(() => useAuth());

            // Set user manually for this test
            await act(async () => {
                result.current.user = mockUser;
            });

            await act(async () => {
                await result.current.logout();
            });

            expect(localStorage.getItem('accessToken')).toBeNull();
            expect(localStorage.getItem('refreshToken')).toBeNull();
            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });

        it('should handle logout error gracefully', async () => {
            localStorage.setItem('accessToken', 'test-token');

            vi.mocked(apiService.apiService.logout).mockRejectedValueOnce(
                new Error('Network error')
            );

            const { result } = renderHook(() => useAuth());

            await act(async () => {
                await result.current.logout();
            });

            // Should still clear tokens even if logout fails
            expect(localStorage.getItem('accessToken')).toBeNull();
            expect(result.current.user).toBeNull();
        });
    });

    describe('Loading State', () => {
        it('should set loading to false after login', async () => {
            vi.mocked(apiService.apiService.login).mockResolvedValueOnce({
                data: {
                    user: {
                        id: '1',
                        username: 'testuser',
                        email: 'test@example.com',
                        experienceLevel: 'beginner',
                        createdAt: '2024-01-01',
                        updatedAt: '2024-01-01',
                    },
                    accessToken: 'access-token',
                },
            } as any);

            const { result } = renderHook(() => useAuth());

            await act(async () => {
                await result.current.login('test@example.com', 'password');
            });

            expect(result.current.loading).toBe(false);
        });
    });
});