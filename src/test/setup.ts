import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
    cleanup();
});

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }),
});

const computedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = element => computedStyle(element);

URL.createObjectURL = vi.fn(() => 'blob:test');
URL.revokeObjectURL = vi.fn();

const memoryStorage = (): Storage => {
    const items = new Map<string, string>();
    return {
        get length() {
            return items.size;
        },
        clear: () => items.clear(),
        getItem: key => items.get(key) ?? null,
        key: index => [...items.keys()][index] ?? null,
        removeItem: key => {
            items.delete(key);
        },
        setItem: (key, value) => {
            items.set(key, String(value));
        },
    };
};

for (const name of ['localStorage', 'sessionStorage'] as const) {
    if (typeof globalThis[name]?.getItem !== 'function') {
        Object.defineProperty(globalThis, name, { configurable: true, value: memoryStorage() });
    }
}
