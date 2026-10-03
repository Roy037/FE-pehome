import { useEffect, useState } from 'react';
import { Avatar, Button, Empty, Input, Select, Table, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { avatarUrl } from '@/components/client/avatar';
import ViewTalent from '@/components/admin/talent/view.talent';
import { VipBadge } from '@/components/client/vip';
import { callFetchTalents } from '@/config/api';
import { EXPERIENCE_LIST, INDUSTRY_LIST, LEVEL_LIST, OCCUPATION_LIST, labelOf, timeAgo } from '@/config/utils';
import { ITalent } from '@/types/backend';
import s from '@/styles/admin.module.scss';

interface Filters {
    keyword?: string;
    level?: string;
    experience?: string;
    industry?: string;
    occupation?: string;
    skills?: string[];
}

const TalentPage = () => {
    const [draft, setDraft] = useState<Filters>({});
    const [filters, setFilters] = useState<Filters>({});
    const [paging, setPaging] = useState({ page: 1, size: 10 });
    const [rows, setRows] = useState<ITalent[]>([]);
    const [total, setTotal] = useState(0);
    const [state, setState] = useState<'loading' | 'ready' | 'forbidden' | 'error'>('loading');
    const [openId, setOpenId] = useState<number | null>(null);

    useEffect(() => {
        let ignore = false;
        setState('loading');
        const query = new URLSearchParams({ page: String(paging.page), size: String(paging.size) });
        Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value) ? value.length : value)
                query.set(key, Array.isArray(value) ? value.join(',') : String(value));
        });
        (async () => {
            try {
                const res = await callFetchTalents(query.toString());
                if (ignore) return;
                if (res.data) {
                    setRows(res.data.result);
                    setTotal(res.data.meta.total);
                    setState('ready');
                } else setState(+res.statusCode === 403 ? 'forbidden' : 'error');
            } catch {
                if (!ignore) setState('error');
            }
        })();
        return () => {
            ignore = true;
        };
    }, [filters, paging]);

    const search = () => {
        setPaging(current => ({ ...current, page: 1 }));
        setFilters({ ...draft, keyword: draft.keyword?.trim() });
    };
    const reset = () => {
        setDraft({});
        setPaging(current => ({ ...current, page: 1 }));
        setFilters({});
    };
    const options = (list: string[]) => list.map(value => ({ label: value, value }));

    const columns: ColumnsType<ITalent> = [
        {
            title: 'Ứng viên',
            key: 'person',
            width: 280,
            render: (_, row) => (
                <div className={s.talentPerson}>
                    <Avatar src={row.avatar ? avatarUrl(row.avatar) : undefined}>
                        {row.name.slice(0, 1).toUpperCase()}
                    </Avatar>
                    <div>
                        <strong>
                            {row.name}
                            {row.premium && (
                                <>
                                    {' '}
                                    <VipBadge />
                                </>
                            )}
                        </strong>
                        <small>{row.headline || 'Chưa có chức danh'}</small>
                    </div>
                </div>
            ),
        },
        {
            title: 'Cấp độ',
            key: 'level',
            width: 150,
            render: (_, row) => (
                <>
                    {labelOf(LEVEL_LIST, row.level ?? '') || '—'}
                    <small className={s.talentSub}>{labelOf(EXPERIENCE_LIST, row.experience ?? '')}</small>
                </>
            ),
        },
        {
            title: 'Ngành nghề',
            key: 'field',
            width: 200,
            render: (_, row) => (
                <>
                    {row.occupation || '—'}
                    <small className={s.talentSub}>{row.industry}</small>
                </>
            ),
        },
        {
            title: 'Kỹ năng',
            key: 'skills',
            width: 260,
            render: (_, row) =>
                row.skills.length ? (
                    <>
                        {row.skills.slice(0, 4).map(skill => (
                            <Tag key={skill.name}>{skill.name}</Tag>
                        ))}
                        {row.skills.length > 4 && <Tag>+{row.skills.length - 4}</Tag>}
                    </>
                ) : (
                    '—'
                ),
        },
        { title: 'Cập nhật', dataIndex: 'updatedAt', width: 110, render: (value?: string) => timeAgo(value) },
        {
            title: '',
            key: 'view',
            width: 80,
            render: (_, row) => (
                <Button size="small" onClick={() => setOpenId(row.id)}>
                    Xem
                </Button>
            ),
        },
    ];

    return (
        <div className={s.dashboard}>
            <header className={s.dashHead}>
                <div>
                    <h1>Kho ứng viên</h1>
                    <p>Hồ sơ của các ứng viên đã cho phép nhà tuyển dụng tìm thấy mình.</p>
                </div>
            </header>

            <form
                className={s.talentFilters}
                onSubmit={event => {
                    event.preventDefault();
                    search();
                }}
            >
                <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    placeholder="Tên, chức danh, ngành nghề…"
                    value={draft.keyword}
                    maxLength={100}
                    onChange={event => setDraft({ ...draft, keyword: event.target.value })}
                    aria-label="Từ khóa"
                />
                <Select
                    allowClear
                    placeholder="Cấp độ"
                    options={LEVEL_LIST}
                    value={draft.level}
                    onChange={level => setDraft({ ...draft, level })}
                />
                <Select
                    allowClear
                    placeholder="Kinh nghiệm"
                    options={EXPERIENCE_LIST}
                    value={draft.experience}
                    onChange={experience => setDraft({ ...draft, experience })}
                />
                <Select
                    allowClear
                    showSearch
                    placeholder="Lĩnh vực"
                    options={options(INDUSTRY_LIST)}
                    value={draft.industry}
                    onChange={industry => setDraft({ ...draft, industry })}
                />
                <Select
                    allowClear
                    showSearch
                    placeholder="Ngành nghề"
                    options={options(OCCUPATION_LIST)}
                    value={draft.occupation}
                    onChange={occupation => setDraft({ ...draft, occupation })}
                />
                <Select
                    mode="tags"
                    maxCount={10}
                    tokenSeparators={[',']}
                    placeholder="Kỹ năng (cần có đủ)"
                    value={draft.skills}
                    onChange={skills => setDraft({ ...draft, skills })}
                    open={false}
                    suffixIcon={null}
                />
                <div className={s.talentActions}>
                    <Button type="primary" htmlType="submit">
                        Tìm kiếm
                    </Button>
                    <Button onClick={reset}>Đặt lại</Button>
                </div>
            </form>

            {state === 'forbidden' ? (
                <Empty description="Công ty của bạn cần được quản trị viên duyệt trước khi xem kho ứng viên." />
            ) : state === 'error' ? (
                <Empty description="Chưa tải được danh sách ứng viên. Vui lòng thử lại." />
            ) : (
                <Table<ITalent>
                    rowKey="id"
                    columns={columns}
                    dataSource={rows}
                    loading={state === 'loading'}
                    scroll={{ x: 'max-content' }}
                    locale={{
                        emptyText: (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ứng viên nào phù hợp." />
                        ),
                    }}
                    onRow={row => ({ onClick: () => setOpenId(row.id), style: { cursor: 'pointer' } })}
                    pagination={{
                        current: paging.page,
                        pageSize: paging.size,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 20, 50],
                        showTotal: (all, range) => `${range[0]}–${range[1]} / ${all} ứng viên`,
                        onChange: (page, size) => setPaging({ page, size }),
                    }}
                />
            )}

            <ViewTalent id={openId} onClose={() => setOpenId(null)} />
        </div>
    );
};

export default TalentPage;
