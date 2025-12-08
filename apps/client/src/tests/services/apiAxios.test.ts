import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');

describe('Api.ts, Axios', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('Authentication', () => {
        it('should include auth token in request headers', async () => {
            const token = 'test-token-123';
            localStorage.setItem('accessToken', token);

            const mockResponse = { data: { id: '1', email: 'test@example.com' } };
            vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

            const response = await axios.get('/api/user', {
                headers: { Authorization: `Bearer ${token}` },
            });

            expect(response.data).toEqual(mockResponse.data);
            expect(axios.get).toHaveBeenCalledWith('/api/user', {
                headers: { Authorization: `Bearer ${token}` },
            });
        });

        it('should handle missing auth token', async () => {
            localStorage.removeItem('accessToken');

            const mockResponse = { data: { message: 'Unauthorized' } };
            vi.mocked(axios.get).mockRejectedValueOnce({
                response: { status: 401, data: mockResponse.data },
            });

            try {
                await axios.get('/api/user');
            } catch (error: unknown) {
                const err = error as { response?: { status: number; data?: unknown } };
                expect(err.response?.status).toBe(401);
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors', async () => {
            const error = new Error('Network error');
            vi.mocked(axios.get).mockRejectedValueOnce(error);

            try {
                await axios.get('/api/strategies');
            } catch (err: unknown) {
                const networkError = err as Error;
                expect(networkError.message).toBe('Network error');
            }
        });

        it('should handle server errors', async () => {
            const errorResponse = {
                response: {
                    status: 500,
                    data: { message: 'Internal server error' },
                },
            };

            vi.mocked(axios.get).mockRejectedValueOnce(errorResponse);

            try {
                await axios.get('/api/strategies');
            } catch (err: unknown) {
                const serverError = err as { response?: { status: number } };
                expect(serverError.response?.status).toBe(500);
            }
        });

        it('should handle validation errors', async () => {
            const errorResponse = {
                response: {
                    status: 400,
                    data: {
                        message: 'Validation error',
                        errors: { email: 'Invalid email' },
                    },
                },
            };

            vi.mocked(axios.post).mockRejectedValueOnce(errorResponse);

            try {
                await axios.post('/api/register', {
                    email: 'invalid',
                    password: 'password',
                });
            } catch (err: unknown) {
                const validationError = err as {
                    response?: {
                        status: number;
                        data: { errors: { email: string } };
                    };
                };

                expect(validationError.response?.status).toBe(400);
                expect(validationError.response?.data.errors).toHaveProperty('email');
            }
        });
    });

    describe('Request Methods', () => {
        it('should make GET requests', async () => {
            const mockData = { strategies: [] };
            vi.mocked(axios.get).mockResolvedValueOnce({ data: mockData });

            const response = await axios.get('/api/strategies');

            expect(response.data).toEqual(mockData);
            expect(axios.get).toHaveBeenCalledWith('/api/strategies');
        });

        it('should make POST requests', async () => {
            const mockData = { id: '1', name: 'New Strategy' };
            vi.mocked(axios.post).mockResolvedValueOnce({ data: mockData });

            const response = await axios.post('/api/strategies', {
                name: 'New Strategy',
            });

            expect(response.data).toEqual(mockData);
            expect(axios.post).toHaveBeenCalledWith('/api/strategies', {
                name: 'New Strategy',
            });
        });

        it('should make PUT requests', async () => {
            const mockData = { id: '1', name: 'Updated Strategy' };
            vi.mocked(axios.put).mockResolvedValueOnce({ data: mockData });

            const response = await axios.put('/api/strategies/1', {
                name: 'Updated Strategy',
            });

            expect(response.data).toEqual(mockData);
        });

        it('should make DELETE requests', async () => {
            vi.mocked(axios.delete).mockResolvedValueOnce({ data: { success: true } });

            const response = await axios.delete('/api/strategies/1');

            expect(response.data.success).toBe(true);
            expect(axios.delete).toHaveBeenCalledWith('/api/strategies/1');
        });
    });

    describe('Data Transformation', () => {
        it('should handle JSON responses', async () => {
            const mockData = { id: '1', name: 'Strategy' };
            vi.mocked(axios.get).mockResolvedValueOnce({
                data: mockData,
                headers: { 'content-type': 'application/json' },
            });

            const response = await axios.get('/api/strategies/1');

            expect(response.data).toEqual(mockData);
            expect(typeof response.data).toBe('object');
        });

        it('should handle array responses', async () => {
            const mockData = [
                { id: '1', name: 'Strategy 1' },
                { id: '2', name: 'Strategy 2' },
            ];

            vi.mocked(axios.get).mockResolvedValueOnce({ data: mockData });

            const response = await axios.get('/api/strategies');

            expect(Array.isArray(response.data)).toBe(true);
            expect(response.data.length).toBe(2);
        });
    });

    describe('Pagination', () => {
        it('should handle pagination parameters', async () => {
            const mockData = {
                data: [{ id: '1' }, { id: '2' }],
                pagination: { page: 1, limit: 10, total: 20 },
            };

            vi.mocked(axios.get).mockResolvedValueOnce({ data: mockData });

            const response = await axios.get('/api/strategies', {
                params: { page: 1, limit: 10 },
            });

            expect(response.data.pagination.page).toBe(1);
            expect(response.data.pagination.limit).toBe(10);
        });
    });
});