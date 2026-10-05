import { CSSProperties, FormEvent, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SalaryRange from '@/components/client/salary-range';
import { Button, Checkbox, Drawer, Grid, Pagination, Select } from 'antd';
import { FilterOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { sfIn, sfLike } from 'spring-filter-query-builder';
import { callFetchAllSkill, callFetchJob } from '@/config/api';
import { pageItemRender } from '@/components/client/page-nav';
import { useRequest } from '@/config/use-request';
import {
    COMPANY_TYPE_LIST,
    EMPLOYMENT_TYPE_LIST,
    LEVEL_LIST,
    LOCATION_LIST,
    SALARY_MAX_M,
    WORK_MODE_LIST,
    escapeFilter,
    openJobsFilter,
    salaryRangeFilter,
} from '@/config/utils';
import { JobRow } from '@/components/client/card/job.card';
import { AssetImage, Sparkle, StatePanel } from '@/components/client/decor';
import { ASSETS } from '@/config/assets';
import ui from '@/styles/client.module.scss';
import d from '@/styles/discovery.module.scss';

const PAGE_SIZE = 8;
const SORTS = [
    { value: 'newest', label: 'Mới nhất', sort: 'createdAt,desc' },
    { value: 'salary-desc', label: 'Lương cao nhất', sort: 'salaryMax,desc' },
    { value: 'salary-asc', label: 'Lương thấp nhất', sort: 'salary,asc' },
];
type Option = { label: string; value: string };
const listParam = (params: URLSearchParams, key: string) => params.get(key)?.split(',').filter(Boolean) ?? [];
const onlyKnown = (values: string[], options: Option[]) =>
    values.filter(value => options.some(option => option.value === value));

const FilterGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <details className={d.filterGroup} open>
        <summary>{title}</summary>
        <div className={d.filterBody}>{children}</div>
    </details>
);

const ClientJobPage = () => {
    const [params, setParams] = useSearchParams();
    const phone = !Grid.useBreakpoint().sm;
    const search = params.toString();
    const q = params.get('q')?.trim() ?? '';
    const [keyword, setKeyword] = useState(q);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showAllSkills, setShowAllSkills] = useState(false);
    const listTop = useRef<HTMLDivElement>(null);
    useEffect(() => setKeyword(q), [q]);

    const selected = {
        location: onlyKnown(listParam(params, 'location'), LOCATION_LIST),
        skills: listParam(params, 'skills').filter(value => /^\d+$/.test(value)),
        level: onlyKnown(listParam(params, 'level'), LEVEL_LIST),
        type: onlyKnown(listParam(params, 'type'), EMPLOYMENT_TYPE_LIST),
        mode: onlyKnown(listParam(params, 'mode'), WORK_MODE_LIST),
        company: onlyKnown(listParam(params, 'company'), COMPANY_TYPE_LIST),
    };
    const salaryParam = /^(\d{1,3})-(\d{1,3})$/.exec(params.get('salary') ?? '');
    const salaryLo = salaryParam ? Math.min(+salaryParam[1], SALARY_MAX_M) : 0;
    const salaryHi = salaryParam ? Math.min(Math.max(+salaryParam[2], salaryLo), SALARY_MAX_M) : SALARY_MAX_M;
    const salaryNarrowed = salaryLo > 0 || salaryHi < SALARY_MAX_M;
    const withDeal = salaryNarrowed && params.get('deal') === '1';
    const sort = SORTS.find(item => item.value === params.get('sort')) ?? SORTS[0];
    const page = Math.max(1, Number(params.get('page')) || 1);
    const activeCount =
        Object.values(selected).reduce((sum, values) => sum + values.length, 0) + (salaryNarrowed ? 1 : 0);

    const skills = useRequest(() => callFetchAllSkill('page=1&size=100&sort=name,asc'), []);
    const allJobs = useRequest(() => callFetchJob(`page=1&size=1&filter=${encodeURIComponent(openJobsFilter())}`), []);
    const jobs = useRequest(() => {
        const filter = [openJobsFilter()];
        if (q) filter.push(sfLike('name', escapeFilter(q.slice(0, 120)), true).toString());
        if (selected.location.length) filter.push(sfIn('location', selected.location).toString());
        if (selected.skills.length) filter.push(sfIn('skills.id', selected.skills.map(Number)).toString());
        if (selected.level.length) filter.push(sfIn('level', selected.level).toString());
        if (selected.type.length) filter.push(sfIn('employmentType', selected.type).toString());
        if (selected.mode.length) filter.push(sfIn('workMode', selected.mode).toString());
        if (selected.company.length) filter.push(sfIn('company.companyType', selected.company).toString());
        if (salaryNarrowed) filter.push(salaryRangeFilter(salaryLo, salaryHi, withDeal));
        const query = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
        // jobs a company paid to pin come first, then the order the person chose
        query.append('sort', 'pinnedUntil,desc');
        query.append('sort', sort.sort);
        query.append('filter', filter.join(' and '));
        return callFetchJob(query.toString());
    }, [search]);

    const update = (key: string, value: string | string[] | null) => {
        const next = new URLSearchParams(params);
        const text = Array.isArray(value) ? value.join(',') : value;
        if (text) next.set(key, text);
        else next.delete(key);
        if (key !== 'page') next.delete('page');
        setParams(next);
    };

    const commitSalary = (low: number, high: number, deal: boolean) => {
        const next = new URLSearchParams(params);
        if (low <= 0 && high >= SALARY_MAX_M) {
            next.delete('salary');
            next.delete('deal');
        } else {
            next.set('salary', `${low}-${high}`);
            if (deal) next.set('deal', '1');
            else next.delete('deal');
        }
        next.delete('page');
        setParams(next);
    };

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        update('q', keyword.trim() || null);
    };

    const resetFilters = () => setParams(q ? { q } : {});
    const skillOptions: Option[] = (skills.data?.result ?? []).map(skill => ({
        label: skill.name ?? '',
        value: String(skill.id),
    }));
    const total = jobs.data?.meta.total ?? 0;

    const filters = (
        <div className={d.filters}>
            <div className={d.filtersHead}>
                <h2>Bộ lọc</h2>
                {activeCount > 0 && (
                    <button type="button" onClick={resetFilters}>
                        Đặt lại
                    </button>
                )}
            </div>
            <FilterGroup title="Hình thức làm việc">
                <Checkbox.Group
                    options={EMPLOYMENT_TYPE_LIST}
                    value={selected.type}
                    onChange={value => update('type', value as string[])}
                />
            </FilterGroup>
            <FilterGroup title="Nơi làm việc">
                <Checkbox.Group
                    options={WORK_MODE_LIST}
                    value={selected.mode}
                    onChange={value => update('mode', value as string[])}
                />
            </FilterGroup>
            <FilterGroup title="Loại hình công ty">
                <Checkbox.Group
                    options={COMPANY_TYPE_LIST}
                    value={selected.company}
                    onChange={value => update('company', value as string[])}
                />
            </FilterGroup>
            <FilterGroup title="Kỹ năng">
                {skills.error ? (
                    <button type="button" className={d.textButton} onClick={skills.retry}>
                        Tải lại kỹ năng
                    </button>
                ) : (
                    <>
                        <Checkbox.Group
                            options={showAllSkills ? skillOptions : skillOptions.slice(0, 6)}
                            value={selected.skills}
                            onChange={value => update('skills', value as string[])}
                        />
                        {skillOptions.length > 6 && (
                            <button
                                type="button"
                                className={d.textButton}
                                onClick={() => setShowAllSkills(value => !value)}
                            >
                                {showAllSkills ? 'Thu gọn' : `Xem thêm (${skillOptions.length - 6})`}
                            </button>
                        )}
                    </>
                )}
            </FilterGroup>
            <FilterGroup title="Mức lương">
                <SalaryRange min={salaryLo} max={salaryHi} withNegotiable={withDeal} onCommit={commitSalary} />
            </FilterGroup>
            <FilterGroup title="Cấp bậc">
                <Checkbox.Group
                    options={LEVEL_LIST}
                    value={selected.level}
                    onChange={value => update('level', value as string[])}
                />
            </FilterGroup>
            <FilterGroup title="Địa điểm">
                <Checkbox.Group
                    options={LOCATION_LIST}
                    value={selected.location}
                    onChange={value => update('location', value as string[])}
                />
            </FilterGroup>
        </div>
    );

    return (
        <div className={d.page}>
            <section className={d.hero} aria-labelledby="jobs-title">
                <Sparkle className={d.heroSparkleA} />
                <Sparkle className={d.heroSparkleB} />
                <AssetImage asset={ASSETS.explorerLeft} className={d.heroIllustrationLeft} />
                <AssetImage asset={ASSETS.explorerRight} className={d.heroIllustrationRight} />
                <div className={ui.container}>
                    <h1 id="jobs-title" className="enter">
                        {allJobs.data ? (
                            <>
                                <span>{allJobs.data.meta.total.toLocaleString('vi-VN')}</span> việc làm đang tuyển
                            </>
                        ) : (
                            'Khám phá việc làm'
                        )}
                    </h1>
                    <p className="enter" style={{ '--i': 1 } as CSSProperties}>
                        Tìm vị trí lý tưởng giữa những cơ hội đang mở. Lọc theo kỹ năng, mức lương và hình thức làm việc
                        để bước tiếp trong sự nghiệp.
                    </p>
                    <form
                        className={`${d.heroSearch} enter`}
                        style={{ '--i': 2 } as CSSProperties}
                        onSubmit={submitSearch}
                        role="search"
                    >
                        <label htmlFor="job-search" className="sr-only">
                            Từ khóa việc làm
                        </label>
                        <input
                            id="job-search"
                            value={keyword}
                            onChange={event => setKeyword(event.target.value)}
                            placeholder="Vị trí, chức danh…"
                            maxLength={120}
                        />
                        <button type="submit" className={ui.btnPrimarySm}>
                            <SearchOutlined aria-hidden="true" /> Tìm kiếm
                        </button>
                    </form>
                </div>
            </section>

            <div className={`${ui.container} ${d.layout}`}>
                <aside
                    className={`${d.sidebar} enter`}
                    style={{ '--i': 2 } as CSSProperties}
                    aria-label="Bộ lọc việc làm"
                >
                    {filters}
                </aside>
                <section className={d.results} aria-label="Kết quả tìm kiếm">
                    <div className={d.listHead} ref={listTop}>
                        <p aria-live="polite">
                            {jobs.loading ? (
                                'Đang tìm việc làm…'
                            ) : (
                                <>
                                    Hiển thị <strong>{total.toLocaleString('vi-VN')}</strong> việc làm
                                    {q ? <> cho “{q}”</> : null}
                                </>
                            )}
                        </p>
                        <div className={d.listTools}>
                            <Button
                                className={d.filterButton}
                                icon={<FilterOutlined />}
                                onClick={() => setDrawerOpen(true)}
                            >
                                Bộ lọc{activeCount ? ` (${activeCount})` : ''}
                            </Button>
                            <label className={d.sortLabel}>
                                <span>Sắp xếp:</span>
                                <Select
                                    value={sort.value}
                                    onChange={value => update('sort', value === 'newest' ? null : value)}
                                    options={SORTS}
                                    bordered={false}
                                    popupMatchSelectWidth={false}
                                    aria-label="Sắp xếp việc làm"
                                />
                            </label>
                        </div>
                    </div>
                    {jobs.loading ? (
                        <div className={ui.jobList} aria-busy="true">
                            {Array.from({ length: 4 }, (_, index) => (
                                <div key={index} className={d.skeletonRow} />
                            ))}
                        </div>
                    ) : jobs.error ? (
                        <StatePanel
                            icon={<ReloadOutlined />}
                            title="Chưa thể tải danh sách việc làm"
                            text="Vui lòng kiểm tra kết nối và thử lại sau ít phút."
                            action={
                                <button type="button" className={ui.btnOutline} onClick={jobs.retry}>
                                    Thử lại
                                </button>
                            }
                        />
                    ) : total === 0 ? (
                        <StatePanel
                            icon={<SearchOutlined />}
                            title="Chưa tìm thấy công việc phù hợp"
                            text="Thử từ khóa khác hoặc bỏ bớt bộ lọc để xem thêm cơ hội."
                            action={
                                activeCount > 0 || q ? (
                                    <button type="button" className={ui.btnOutline} onClick={() => setParams({})}>
                                        Xóa tìm kiếm & bộ lọc
                                    </button>
                                ) : undefined
                            }
                        />
                    ) : (
                        <div className={ui.jobList}>
                            {jobs.data?.result.map((job, index) => (
                                <JobRow key={job.id} job={job} index={index} />
                            ))}
                        </div>
                    )}
                </section>
                {!jobs.loading && total > PAGE_SIZE && (
                    <Pagination
                        className={`${d.pagination} ${d.listPagination}`}
                        simple={phone}
                        current={page}
                        total={total}
                        pageSize={PAGE_SIZE}
                        showSizeChanger={false}
                        onChange={next => {
                            update('page', String(next));
                            listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        itemRender={pageItemRender}
                    />
                )}
            </div>

            <Drawer
                title="Lọc việc làm"
                placement="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                width={320}
                footer={
                    <Button type="primary" block onClick={() => setDrawerOpen(false)}>
                        Xem {total.toLocaleString('vi-VN')} việc làm
                    </Button>
                }
            >
                {filters}
            </Drawer>
        </div>
    );
};

export default ClientJobPage;
