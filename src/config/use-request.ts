import { DependencyList, useCallback, useEffect, useState } from 'react';
import type { AxiosResponse } from 'axios';
import { IBackendRes } from '@/types/backend';

interface RequestState<T> {
    data?: T;
    loading: boolean;
    error: boolean;
    notFound: boolean;
}

// The axios interceptor returns the body, so awaiting a call yields IBackendRes<T> (see types/file.d.ts).
export const useRequest = <T>(load: () => Promise<AxiosResponse<IBackendRes<T>>> | null, deps: DependencyList) => {
    const [state, setState] = useState<RequestState<T>>({ loading: true, error: false, notFound: false });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const request = load();
        if (!request) {
            setState({ loading: false, error: false, notFound: true });
            return;
        }
        let ignore = false;
        setState(previous => ({ ...previous, loading: true, error: false, notFound: false }));
        (async () => {
            try {
                const res = await request;
                if (ignore) return;
                const missing = res.data === undefined;
                const notFound = missing && [400, 404].includes(Number(res.statusCode));
                setState({ data: res.data ?? undefined, loading: false, error: missing && !notFound, notFound });
            } catch {
                if (!ignore) setState({ loading: false, error: true, notFound: false });
            }
        })();
        return () => {
            ignore = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, attempt]);

    const retry = useCallback(() => setAttempt(value => value + 1), []);
    return { ...state, retry };
};
