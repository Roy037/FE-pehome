import { describe, expect, it } from 'vitest';
import { IJob } from '@/types/backend';
import { isPinned } from './job.card';

const job = (pinnedUntil: string | null) => ({ id: 1, name: 'QA', pinnedUntil }) as unknown as IJob;

describe('isPinned', () => {
    it('marks a job as pinned only until the paid time runs out', () => {
        expect(isPinned(job(new Date(Date.now() + 3_600_000).toISOString()))).toBe(true);
        expect(isPinned(job(new Date(Date.now() - 1000).toISOString()))).toBe(false);
        expect(isPinned(job(null))).toBe(false);
    });
});
