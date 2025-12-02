import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { renderWithProviders } from '../test-utils';
import { BrowserRouter } from 'react-router-dom';

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

describe('ProtectedRoute', () => {
    const TestComponent = () => <div>Protected Content</div>;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Authenticated User', () => {
        it('should render component when user is authenticated', async () => {
            mockUseAuth.mockReturnValue({
                user: { id: '1', username: 'testuser', email: 'test@example.com' },
                isAuthenticated: true,
                loading: false,
                error: null,
                login: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
            } as any);

            renderWithProviders(
                <BrowserRouter>
                    <ProtectedRoute component={TestComponent} />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Protected Content')).toBeInTheDocument();
            });
        });
    });

    describe('Unauthenticated User', () => {
        it('should redirect to login when user is not authenticated', async () => {
            mockUseAuth.mockReturnValue({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: null,
                login: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
            } as any);

            const { container } = renderWithProviders(
                <BrowserRouter>
                    <ProtectedRoute component={TestComponent} />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
            });
        });
    });

    describe('Loading State', () => {
        it('should show loading state while checking authentication', () => {
            mockUseAuth.mockReturnValue({
                user: null,
                isAuthenticated: false,
                loading: true,
                error: null,
                login: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
            } as any);

            renderWithProviders(
                <BrowserRouter>
                    <ProtectedRoute component={TestComponent} />
                </BrowserRouter>
            );

            // Should not show protected content while loading
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });

        it('should render component after loading completes for authenticated user', async () => {
            mockUseAuth.mockReturnValue({
                user: { id: '1', username: 'testuser', email: 'test@example.com' },
                isAuthenticated: true,
                loading: false,
                error: null,
                login: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
            } as any);

            renderWithProviders(
                <BrowserRouter>
                    <ProtectedRoute component={TestComponent} />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Protected Content')).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle authentication error gracefully', async () => {
            mockUseAuth.mockReturnValue({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: 'Authentication failed',
                login: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
            } as any);

            renderWithProviders(
                <BrowserRouter>
                    <ProtectedRoute component={TestComponent} />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
            });
        });
    });

    describe('Component Props', () => {
        it('should pass props to protected component', async () => {
            mockUseAuth.mockReturnValue({
                user: { id: '1', username: 'testuser', email: 'test@example.com' },
                isAuthenticated: true,
                loading: false,
                error: null,
                login: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
            } as any);

            const ComponentWithProps = ({ title }: { title: string }) => (
                <div>{title}</div>
            );

            renderWithProviders(
                <BrowserRouter>
                    <ProtectedRoute component={ComponentWithProps} title="Test Title" />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Test Title')).toBeInTheDocument();
            });
        });
    });
});