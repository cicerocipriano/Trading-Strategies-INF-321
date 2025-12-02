import React, { ReactElement } from 'react';
import {
    render,
    RenderOptions,
    renderHook,
    RenderHookOptions,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
            mutations: {
                retry: false,
            },
        },
    });

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    queryClient?: QueryClient;
}

export function renderWithProviders(
    ui: ReactElement,
    {
        queryClient = createTestQueryClient(),
        ...renderOptions
    }: ExtendedRenderOptions = {}
) {
    function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    }

    return {
        ...render(ui, { wrapper: Wrapper, ...renderOptions }),
        queryClient,
    };
}

// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

export function renderHookWithProviders<TProps, TResult>(
    callback: (props: TProps) => TResult,
    options: RenderHookOptions<TProps> = {}
) {
    const queryClient = createTestQueryClient();

    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return {
        ...renderHook(callback, {
            wrapper: Wrapper,
            ...options,
        }),
        queryClient,
    };
}