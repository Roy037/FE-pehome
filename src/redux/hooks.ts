import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useIsVip = () => useAppSelector(state => Boolean(state.plan.plan));
export const useIsEmployer = () => useAppSelector(state => Boolean(state.account.user?.company));
