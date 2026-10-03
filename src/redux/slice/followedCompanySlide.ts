import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { callFetchFollowedCompanies, callFollowCompany, callUnfollowCompany } from '@/config/api';
import { setLogoutAction } from './accountSlide';

export const fetchFollowedCompanies = createAsyncThunk('followedCompany/fetch', async () => {
    const res = await callFetchFollowedCompanies();
    if (!res.data) throw new Error(res.message);
    return res.data.map(company => String(company.id));
});

export const toggleFollowedCompany = createAsyncThunk(
    'followedCompany/toggle',
    async ({ id, followed }: { id: string; followed: boolean }) => {
        const res = followed ? await callUnfollowCompany(id) : await callFollowCompany(id);
        if (+res.statusCode !== 200) throw new Error(res.message);
    },
);

const followedCompanySlide = createSlice({
    name: 'followedCompany',
    initialState: { ids: [] as string[] },
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchFollowedCompanies.fulfilled, (state, action) => {
                state.ids = action.payload;
            })
            // Optimistic like savedJob: flip immediately, undo if the request fails.
            .addCase(toggleFollowedCompany.pending, (state, action) => {
                const { id, followed } = action.meta.arg;
                state.ids = followed ? state.ids.filter(item => item !== id) : [id, ...state.ids];
            })
            .addCase(toggleFollowedCompany.rejected, (state, action) => {
                const { id, followed } = action.meta.arg;
                state.ids = followed ? [id, ...state.ids] : state.ids.filter(item => item !== id);
            })
            .addCase(setLogoutAction, state => {
                state.ids = [];
            });
    },
});

export default followedCompanySlide.reducer;
