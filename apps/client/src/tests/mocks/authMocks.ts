import { vi } from 'vitest';
import type { useAuth as useAuthHook } from '@/hooks/useAuth';

export type UseAuthReturn = ReturnType<typeof useAuthHook>;

export const createAuthMock = (
    overrides: Partial<UseAuthReturn> = {}
): UseAuthReturn => ({
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    ...overrides,
});
