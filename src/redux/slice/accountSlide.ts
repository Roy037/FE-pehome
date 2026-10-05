import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { callFetchAccount } from '@/config/api';

// First, create the thunk
export const fetchAccount = createAsyncThunk('account/fetchAccount', async () => {
    const response = await callFetchAccount();
    return response.data;
});

interface IState {
    isAuthenticated: boolean;
    isLoading: boolean;
    isRefreshToken: boolean;
    errorRefreshToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: {
            id?: string;
            name?: string;
            permissions?: {
                id: string;
                name: string;
                apiPath: string;
                method: string;
                module: string;
            }[];
        };
        company: { id: number; name: string; approved: boolean; rejectionReason?: string | null } | null;
        avatar: string | null;
        emailVerified: boolean;
        termsRequired: boolean;
    };
    activeMenu: string;
}

const initialState: IState = {
    isAuthenticated: false,
    isLoading: typeof window !== 'undefined' && Boolean(localStorage.getItem('access_token')),
    isRefreshToken: false,
    errorRefreshToken: '',
    user: {
        id: '',
        email: '',
        name: '',
        role: {
            id: '',
            name: '',
            permissions: [],
        },
        company: null,
        avatar: null,
        emailVerified: true,
        termsRequired: false,
    },

    activeMenu: 'home',
};

export const accountSlide = createSlice({
    name: 'account',
    initialState,
    // The `reducers` field lets us define reducers and generate associated actions
    reducers: {
        // Use the PayloadAction type to declare the contents of `action.payload`
        setActiveMenu: (state, action) => {
            state.activeMenu = action.payload;
        },
        setUserLoginInfo: (state, action) => {
            state.isAuthenticated = true;
            state.isLoading = false;
            state.user.id = action?.payload?.id;
            state.user.email = action.payload.email;
            state.user.name = action.payload.name;
            state.user.role = action?.payload?.role;
            state.user.company = action?.payload?.company ?? null;
            state.user.avatar = action?.payload?.avatar ?? null;
            state.user.emailVerified = action?.payload?.emailVerified ?? true;
            state.user.termsRequired = action?.payload?.termsRequired ?? false;

            if (!action?.payload?.role) state.user.role = {};
            state.user.role.permissions = action?.payload?.role?.permissions ?? [];
        },
        setLogoutAction: (state, _action) => {
            localStorage.removeItem('access_token');
            state.isAuthenticated = false;
            state.isLoading = false;
            state.user = {
                id: '',
                email: '',
                name: '',
                role: {
                    id: '',
                    name: '',
                    permissions: [],
                },
                company: null,
                avatar: null,
                emailVerified: true,
                termsRequired: false,
            };
        },
        setRefreshTokenAction: (state, action) => {
            state.isRefreshToken = action.payload?.status ?? false;
            state.errorRefreshToken = action.payload?.message ?? '';
        },
    },
    extraReducers: builder => {
        // Add reducers for additional action types here, and handle loading state as needed
        builder.addCase(fetchAccount.pending, state => {
            state.isLoading = true;
        });

        builder.addCase(fetchAccount.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = Boolean(action.payload?.user);
            if (action.payload) {
                state.isAuthenticated = true;
                state.isLoading = false;
                state.user.id = action?.payload?.user?.id;
                state.user.email = action.payload.user?.email;
                state.user.name = action.payload.user?.name;
                state.user.role = action?.payload?.user?.role;
                state.user.company = action?.payload?.user?.company ?? null;
                state.user.avatar = action?.payload?.user?.avatar ?? null;
                state.user.emailVerified = action?.payload?.user?.emailVerified ?? true;
                state.user.termsRequired = action?.payload?.user?.termsRequired ?? false;
                if (!action?.payload?.user?.role) state.user.role = {};
                state.user.role.permissions = action?.payload?.user?.role?.permissions ?? [];
            }
        });

        builder.addCase(fetchAccount.rejected, state => {
            state.isAuthenticated = false;
            state.isLoading = false;
        });
    },
});

export const { setActiveMenu, setUserLoginInfo, setLogoutAction, setRefreshTokenAction } = accountSlide.actions;

export default accountSlide.reducer;
