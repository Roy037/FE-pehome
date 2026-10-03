import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { callFetchMyPlan } from '@/config/api';
import { PlanCode } from '@/types/backend';
import { setLogoutAction } from './accountSlide';

export const fetchMyPlanCode = createAsyncThunk('plan/fetch', async () => {
    const res = await callFetchMyPlan();
    if (!res.data) throw new Error(res.message);
    return res.data.plan;
});

// Only the plan code is kept here (null = free tier): it drives the VIP look of the signed-in user's avatar.
const planSlide = createSlice({
    name: 'plan',
    initialState: { plan: null as PlanCode | null },
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchMyPlanCode.fulfilled, (state, action) => {
                state.plan = action.payload;
            })
            .addCase(setLogoutAction, state => {
                state.plan = null;
            });
    },
});

export default planSlide.reducer;
