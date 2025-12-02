import '@testing-library/jest-dom';
import { afterEach, afterAll, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
    cleanup();
});

const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

const originalError = console.error;

beforeAll(() => {
    console.error = (...args: unknown[]) => {
        const [first] = args;

        if (
            typeof first === 'string' &&
            first.includes('Warning: ReactDOM.render')
        ) {
            return;
        }

        const typedArgs = args as Parameters<typeof originalError>;
        originalError(...typedArgs);
    };
});

afterAll(() => {
    console.error = originalError;
});