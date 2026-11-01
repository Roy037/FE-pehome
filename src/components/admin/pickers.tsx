import { sfLike } from 'spring-filter-query-builder';
import { callFetchCompany, callFetchJob, callFetchUser } from '@/config/api';
import { escapeFilter } from '@/config/utils';

export interface PickerOption {
    label: string;
    value: string;
}

const searchQuery = (search: string) => {
    const params = new URLSearchParams({ page: '1', size: '20' });
    if (search.trim()) params.set('filter', sfLike('name', escapeFilter(search.trim()), true).toString());
    return params.toString();
};

export const searchUsers = async (search: string): Promise<PickerOption[]> => {
    const res = await callFetchUser(searchQuery(search));
    return (res.data?.result ?? []).map(user => ({ label: `${user.name} (${user.email})`, value: String(user.id) }));
};

export const searchCompanies = async (search: string): Promise<PickerOption[]> => {
    const res = await callFetchCompany(searchQuery(search));
    return (res.data?.result ?? []).map(company => ({ label: company.name as string, value: String(company.id) }));
};

export const searchJobs = async (search: string): Promise<PickerOption[]> => {
    const res = await callFetchJob(searchQuery(search));
    return (res.data?.result ?? []).map(job => ({
        label: job.company?.name ? `${job.name} — ${job.company.name}` : job.name,
        value: String(job.id),
    }));
};
