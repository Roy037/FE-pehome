import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { callFetchSavedJobs, callSaveJob, callUnsaveJob } from '@/config/api';
import { setLogoutAction } from './accountSlide';

export const fetchSavedJobs = createAsyncThunk('savedJob/fetch', async () => {
    const res = await callFetchSavedJobs();
    if (!res.data) throw new Error(res.message);
    return res.data.map(job => String(job.id));
});

export const toggleSavedJob = createAsyncThunk(
    'savedJob/toggle',
    async ({ id, saved }: { id: string; saved: boolean }) => {
        const res = saved ? await callUnsaveJob(id) : await callSaveJob(id);
        if (+res.statusCode !== 200) throw new Error(res.message);
    },
);

const savedJobSlide = createSlice({
    name: 'savedJob',
    initialState: { ids: [] as string[] },
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchSavedJobs.fulfilled, (state, action) => {
                state.ids = action.payload;
            })
            // Optimistic: flip immediately, undo if the request fails.
            .addCase(toggleSavedJob.pending, (state, action) => {
                const { id, saved } = action.meta.arg;
                state.ids = saved ? state.ids.filter(item => item !== id) : [id, ...state.ids];
            })
            .addCase(toggleSavedJob.rejected, (state, action) => {
                const { id, saved } = action.meta.arg;
                state.ids = saved ? [id, ...state.ids] : state.ids.filter(item => item !== id);
            })
            .addCase(setLogoutAction, state => {
                state.ids = [];
            });
    },
});

export default savedJobSlide.reducer;
