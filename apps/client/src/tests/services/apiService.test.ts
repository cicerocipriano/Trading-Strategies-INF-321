import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AxiosError } from 'axios';

interface RequestHeadersLike {
    Authorization?: string;
    [key: string]: unknown;
}

interface RequestConfigLike {
    headers: RequestHeadersLike;
    [key: string]: unknown;
}

type RequestInterceptor = (config: RequestConfigLike) => RequestConfigLike;
type ErrorInterceptor = (error: AxiosError) => Promise<unknown>;

type FnMock = ReturnType<typeof vi.fn>;

interface AxiosInstanceMock {
    get: FnMock;
    post: FnMock;
    patch: FnMock;
    delete: FnMock;
    interceptors: {
        request: {
            use: (onFulfilled: RequestInterceptor) => void;
        };
        response: {
            use: (
                onFulfilled: (response: unknown) => unknown,
                onRejected?: ErrorInterceptor,
            ) => void;
        };
    };
}

interface AxiosCreateConfig {
    baseURL?: string;
    headers?: Record<string, string>;
}

interface AxiosMockState {
    instance: AxiosInstanceMock;
    lastCreateConfig?: AxiosCreateConfig;
    requestInterceptors: RequestInterceptor[];
    responseErrorInterceptors: ErrorInterceptor[];
}

interface AxiosDefaultMock {
    create: FnMock;
    __mock: AxiosMockState;
}


vi.mock('axios', () => {
    const requestInterceptors: RequestInterceptor[] = [];
    const responseErrorInterceptors: ErrorInterceptor[] = [];

    const instance: AxiosInstanceMock = {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        interceptors: {
            request: {
                use: (onFulfilled: RequestInterceptor): void => {
                    requestInterceptors.push(onFulfilled);
                },
            },
            response: {
                use: (
                    _onFulfilled: (response: unknown) => unknown,
                    onRejected?: ErrorInterceptor,
                ): void => {
                    if (onRejected) {
                        responseErrorInterceptors.push(onRejected);
                    }
                },
            },
        },
    };

    const mockState: AxiosMockState = {
        instance,
        lastCreateConfig: undefined,
        requestInterceptors,
        responseErrorInterceptors,
    };

    const createFn = vi.fn((config: AxiosCreateConfig) => {
        mockState.lastCreateConfig = config;
        return instance;
    });

    const axiosDefault: AxiosDefaultMock = {
        create: createFn as FnMock,
        __mock: mockState,
    };

    return {
        default: axiosDefault,
        __esModule: true,
    };
});

import axios from 'axios';
import { apiService } from '@/services/api';

const axiosDefault = axios as unknown as AxiosDefaultMock;
const apiInstance = axiosDefault.__mock.instance;


describe('ApiService', () => {
    beforeEach(() => {
        localStorage.clear();

        apiInstance.get.mockReset();
        apiInstance.post.mockReset();
        apiInstance.patch.mockReset();
        apiInstance.delete.mockReset();

        window.location.href = 'http://localhost/';
    });

    it('configura axios.create com baseURL e cabeçalho Content-Type JSON', () => {
        const config = axiosDefault.__mock.lastCreateConfig;
        expect(config).toBeDefined();
        if (!config) {
            throw new Error('axios.create não foi chamado');
        }

        expect(config.baseURL).toBeDefined();
        expect(config.headers).toMatchObject({
            'Content-Type': 'application/json',
        });
    });

    it('adiciona Authorization no header quando houver accessToken', () => {
        localStorage.setItem('accessToken', 'fake-token');

        const interceptor = axiosDefault.__mock.requestInterceptors[0];
        expect(interceptor).toBeDefined();

        const config: RequestConfigLike = {
            headers: {},
        };

        const result = interceptor(config);

        expect(result.headers.Authorization).toBe('Bearer fake-token');
    });

    it('não adiciona Authorization quando não houver accessToken', () => {
        localStorage.removeItem('accessToken');

        const interceptor = axiosDefault.__mock.requestInterceptors[0];
        expect(interceptor).toBeDefined();

        const config: RequestConfigLike = {
            headers: {},
        };

        const result = interceptor(config);

        expect(result.headers.Authorization).toBeUndefined();
    });

    it('ao receber 401 remove tokens e redireciona para /login', async () => {
        localStorage.setItem('accessToken', 'token-123');
        localStorage.setItem('refreshToken', 'refresh-456');

        const errorHandler = axiosDefault.__mock.responseErrorInterceptors[0];
        expect(errorHandler).toBeDefined();

        const error401 = {
            response: { status: 401 },
        } as AxiosError;

        const promise = errorHandler(error401);

        await expect(promise).rejects.toBe(error401);
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(localStorage.getItem('refreshToken')).toBeNull();
        expect(window.location.href).toContain('/');
    });

    it('para status diferente de 401 não limpa tokens nem redireciona', async () => {
        localStorage.setItem('accessToken', 'token-123');
        localStorage.setItem('refreshToken', 'refresh-456');
        const hrefAntes = window.location.href;

        const errorHandler = axiosDefault.__mock.responseErrorInterceptors[0];
        expect(errorHandler).toBeDefined();

        const error500 = {
            response: { status: 500 },
        } as AxiosError;

        const promise = errorHandler(error500);

        await expect(promise).rejects.toBe(error500);
        expect(localStorage.getItem('accessToken')).toBe('token-123');
        expect(localStorage.getItem('refreshToken')).toBe('refresh-456');
        expect(window.location.href).toBe(hrefAntes);
    });

    it('login chama POST /auth/login com payload correto', async () => {
        apiInstance.post.mockResolvedValueOnce({
            data: { accessToken: 'abc123' },
        });

        const payload = { email: 'test@example.com', password: '123456' };
        const response = await apiService.login(payload);

        expect(apiInstance.post).toHaveBeenCalledWith('/auth/login', payload);
        expect(response).toEqual({ data: { accessToken: 'abc123' } });
    });

    it('getCurrentUser chama GET /auth/me', async () => {
        apiInstance.get.mockResolvedValueOnce({
            data: { id: 'user-1' },
        });

        const response = await apiService.getCurrentUser();

        expect(apiInstance.get).toHaveBeenCalledWith('/auth/me');
        expect(response).toEqual({ data: { id: 'user-1' } });
    });

    it('getStrategies envia filtros via params', async () => {
        apiInstance.get.mockResolvedValueOnce({ data: [] });

        const filters = {
            proficiencyLevel: 'intermediate',
            marketOutlook: 'bullish',
            volatilityView: 'low',
        };

        const response = await apiService.getStrategies(filters);

        expect(apiInstance.get).toHaveBeenCalledWith('/strategies', {
            params: filters,
        });
        expect(response).toEqual({ data: [] });
    });

    it('getStrategy chama GET /strategies/:id', async () => {
        apiInstance.get.mockResolvedValueOnce({
            data: { id: 'strategy-1' },
        });

        const response = await apiService.getStrategy('strategy-1');

        expect(apiInstance.get).toHaveBeenCalledWith('/strategies/strategy-1');
        expect(response).toEqual({ data: { id: 'strategy-1' } });
    });

    it('getUserSimulations usa params padrão quando options não é informado', async () => {
        apiInstance.get.mockResolvedValueOnce({ data: [] });

        const userId = 'user-123';
        const response = await apiService.getUserSimulations(userId);

        expect(apiInstance.get).toHaveBeenCalledWith(
            `/simulations/user/${userId}`,
            {
                params: {
                    limit: undefined,
                    offset: 0,
                    orderBy: 'recent',
                },
            },
        );
        expect(response).toEqual({ data: [] });
    });

    it('getUserSimulations respeita options passadas', async () => {
        apiInstance.get.mockResolvedValueOnce({ data: [] });

        const userId = 'user-123';
        const options = {
            limit: 10,
            offset: 20,
            orderBy: 'oldest' as const,
        };

        await apiService.getUserSimulations(userId, options);

        expect(apiInstance.get).toHaveBeenCalledWith(
            `/simulations/user/${userId}`,
            {
                params: {
                    limit: 10,
                    offset: 20,
                    orderBy: 'oldest',
                },
            },
        );
    });

    it('getMarketAssets chama GET /market/assets', async () => {
        apiInstance.get.mockResolvedValueOnce({ data: [] });

        const response = await apiService.getMarketAssets();

        expect(apiInstance.get).toHaveBeenCalledWith('/market/assets');
        expect(response).toEqual({ data: [] });
    });

    it('getUserProfile chama GET /users/:userId/profile', async () => {
        apiInstance.get.mockResolvedValueOnce({
            data: { id: 'user-1' },
        });

        const response = await apiService.getUserProfile('user-1');

        expect(apiInstance.get).toHaveBeenCalledWith('/users/user-1/profile');
        expect(response).toEqual({ data: { id: 'user-1' } });
    });

    it('getUserExists chama GET /users/:userId/exists', async () => {
        apiInstance.get.mockResolvedValueOnce({
            data: { exists: true },
        });

        const response = await apiService.getUserExists('user-1');

        expect(apiInstance.get).toHaveBeenCalledWith('/users/user-1/exists');
        expect(response).toEqual({ data: { exists: true } });
    });
});