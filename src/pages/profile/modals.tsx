import { useEffect, useState } from 'react';
import { Button, Checkbox, DatePicker, Form, Input, InputNumber, Modal, Rate, Select } from 'antd';
import { CloseOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { callFetchAllSkill } from '@/config/api';
import { EXPERIENCE_LIST, INDUSTRY_LIST, LEVEL_LIST, OCCUPATION_LIST, SOFT_SKILL_SUGGESTIONS } from '@/config/utils';
import { useRequest } from '@/config/use-request';
import { IProfile, IProfileExperience, IProfileReference, IProfileSkill } from '@/types/backend';
import p from '@/styles/profile.module.scss';

interface BaseProps {
    open: boolean;
    onClose: () => void;
}
type Save<T> = (value: T) => Promise<boolean>;

const modalProps = {
    okText: 'Lưu',
    cancelText: 'Hủy',
    destroyOnClose: true,
    maskClosable: false,
    centered: true,
} as const;

// ---------- Basic info ----------
interface BasicValues {
    name?: string;
    age?: number | null;
    gender?: IProfile['gender'];
    address?: string;
    headline?: string;
    experience?: string;
    level?: string;
    industry?: string;
    occupation?: string;
}
export const BasicModal = ({
    open,
    onClose,
    profile,
    onSave,
}: BaseProps & { profile: IProfile; onSave: Save<Partial<IProfile>> }) => {
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const submit = async (values: BasicValues) => {
        setSaving(true);
        const ok = await onSave({
            name: values.name?.trim(),
            age: typeof values.age === 'number' ? values.age : null,
            gender: values.gender ?? null,
            address: values.address?.trim() || null,
            headline: values.headline?.trim() || null,
            experience: values.experience ?? null,
            level: values.level ?? null,
            industry: values.industry ?? null,
            occupation: values.occupation ?? null,
        });
        setSaving(false);
        if (ok) onClose();
    };
    return (
        <Modal
            {...modalProps}
            title="Thông tin cơ bản"
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
            confirmLoading={saving}
            width={560}
        >
            <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                preserve={false}
                onFinish={submit}
                initialValues={{
                    name: profile.name,
                    age: profile.age ?? undefined,
                    gender: profile.gender ?? undefined,
                    address: profile.address ?? '',
                    headline: profile.headline ?? '',
                    experience: profile.experience ?? undefined,
                    level: profile.level ?? undefined,
                    industry: profile.industry ?? undefined,
                    occupation: profile.occupation ?? undefined,
                }}
            >
                <Form.Item
                    label="Họ và tên"
                    name="name"
                    rules={[
                        { required: true, whitespace: true, message: 'Vui lòng nhập họ tên.' },
                        { max: 100, message: 'Tối đa 100 ký tự.' },
                    ]}
                >
                    <Input placeholder="Nguyễn Văn A" />
                </Form.Item>
                <div className={p.formRow}>
                    <Form.Item label="Tuổi" name="age">
                        <InputNumber
                            min={14}
                            max={100}
                            precision={0}
                            placeholder="Ví dụ: 24"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <Form.Item label="Giới tính" name="gender">
                        <Select
                            allowClear
                            placeholder="Chọn giới tính"
                            options={[
                                { value: 'MALE', label: 'Nam' },
                                { value: 'FEMALE', label: 'Nữ' },
                                { value: 'OTHER', label: 'Khác' },
                            ]}
                        />
                    </Form.Item>
                </div>
                <Form.Item label="Địa chỉ" name="address" rules={[{ max: 255, message: 'Tối đa 255 ký tự.' }]}>
                    <Input placeholder="Ví dụ: Cầu Giấy, Hà Nội" />
                </Form.Item>
                <Form.Item label="Chức danh" name="headline" rules={[{ max: 120, message: 'Tối đa 120 ký tự.' }]}>
                    <Input placeholder="Ví dụ: Frontend Developer" />
                </Form.Item>
                <div className={p.formRow}>
                    <Form.Item label="Kinh nghiệm" name="experience">
                        <Select allowClear placeholder="Chọn kinh nghiệm" options={EXPERIENCE_LIST} />
                    </Form.Item>
                    <Form.Item label="Cấp bậc" name="level">
                        <Select allowClear placeholder="Chọn cấp bậc" options={LEVEL_LIST} />
                    </Form.Item>
                </div>
                <Form.Item label="Lĩnh vực" name="industry">
                    <Select
                        allowClear
                        showSearch
                        placeholder="Chọn lĩnh vực"
                        options={INDUSTRY_LIST.map(value => ({ value, label: value }))}
                    />
                </Form.Item>
                <Form.Item label="Ngành nghề" name="occupation">
                    <Select
                        allowClear
                        showSearch
                        placeholder="Chọn ngành nghề"
                        options={OCCUPATION_LIST.map(value => ({ value, label: value }))}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

// ---------- Career goals ----------
const GoalList = ({ name, title, hint }: { name: 'shortGoals' | 'longGoals'; title: string; hint: string }) => (
    <div className={p.goalGroup}>
        <strong>{title}</strong>
        <small>{hint}</small>
        <Form.List name={name}>
            {(fields, { add, remove }) => (
                <>
                    {fields.map(field => (
                        <div key={field.key} className={p.goalRow}>
                            <Form.Item name={field.name} noStyle rules={[{ max: 300, message: 'Tối đa 300 ký tự.' }]}>
                                <Input placeholder="Nhập mục tiêu của bạn" maxLength={300} />
                            </Form.Item>
                            <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                onClick={() => remove(field.name)}
                                aria-label="Xóa mục tiêu"
                            />
                        </div>
                    ))}
                    {fields.length < 10 && (
                        <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add('')}>
                            Thêm mục tiêu
                        </Button>
                    )}
                </>
            )}
        </Form.List>
    </div>
);

export const GoalsModal = ({
    open,
    onClose,
    profile,
    onSave,
}: BaseProps & { profile: IProfile; onSave: Save<Pick<IProfile, 'shortGoals' | 'longGoals'>> }) => {
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const clean = (values?: string[]) => (values ?? []).map(value => value?.trim()).filter(Boolean);
    const submit = async (values: { shortGoals?: string[]; longGoals?: string[] }) => {
        setSaving(true);
        const ok = await onSave({ shortGoals: clean(values.shortGoals), longGoals: clean(values.longGoals) });
        setSaving(false);
        if (ok) onClose();
    };
    return (
        <Modal
            {...modalProps}
            title="Mục tiêu nghề nghiệp"
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
            confirmLoading={saving}
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                preserve={false}
                onFinish={submit}
                initialValues={{
                    shortGoals: profile.shortGoals.length ? profile.shortGoals : [''],
                    longGoals: profile.longGoals.length ? profile.longGoals : [''],
                }}
            >
                <GoalList name="shortGoals" title="Mục tiêu ngắn hạn" hint="Trong 1–2 năm tới bạn muốn đạt được gì?" />
                <GoalList
                    name="longGoals"
                    title="Mục tiêu dài hạn"
                    hint="Bạn hình dung sự nghiệp của mình sau 5 năm hoặc lâu hơn thế nào?"
                />
            </Form>
        </Modal>
    );
};

// ---------- Work experience ----------
interface ExperienceValues {
    company: string;
    title: string;
    from: Dayjs;
    to?: Dayjs;
    current: boolean;
    description?: string;
}

export const ExperienceModal = ({
    open,
    onClose,
    value,
    onSave,
}: BaseProps & { value: IProfileExperience | null; onSave: Save<IProfileExperience> }) => {
    const [form] = Form.useForm<ExperienceValues>();
    const [saving, setSaving] = useState(false);
    const [current, setCurrent] = useState(Boolean(value?.current));
    useEffect(() => {
        if (open) setCurrent(Boolean(value?.current));
    }, [open, value]);
    const submit = async (values: ExperienceValues) => {
        setSaving(true);
        const ok = await onSave({
            company: values.company.trim(),
            title: values.title.trim(),
            fromMonth: values.from.format('YYYY-MM'),
            toMonth: values.current || !values.to ? '' : values.to.format('YYYY-MM'),
            current: Boolean(values.current),
            description: values.description?.trim() ?? '',
        });
        setSaving(false);
        if (ok) onClose();
    };
    return (
        <Modal
            {...modalProps}
            title={value ? 'Sửa kinh nghiệm làm việc' : 'Thêm kinh nghiệm làm việc'}
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
            confirmLoading={saving}
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                preserve={false}
                onFinish={submit}
                initialValues={{
                    company: value?.company,
                    title: value?.title,
                    current: value?.current ?? false,
                    description: value?.description,
                    from: value?.fromMonth ? dayjs(value.fromMonth, 'YYYY-MM') : undefined,
                    to: value?.toMonth ? dayjs(value.toMonth, 'YYYY-MM') : undefined,
                }}
            >
                <Form.Item
                    label="Công ty"
                    name="company"
                    rules={[
                        { required: true, whitespace: true, message: 'Vui lòng nhập tên công ty.' },
                        { max: 150, message: 'Tối đa 150 ký tự.' },
                    ]}
                >
                    <Input placeholder="Tên công ty" />
                </Form.Item>
                <Form.Item
                    label="Vị trí"
                    name="title"
                    rules={[
                        { required: true, whitespace: true, message: 'Vui lòng nhập vị trí.' },
                        { max: 150, message: 'Tối đa 150 ký tự.' },
                    ]}
                >
                    <Input placeholder="Ví dụ: Backend Developer" />
                </Form.Item>
                <div className={p.formRow}>
                    <Form.Item
                        label="Từ tháng"
                        name="from"
                        rules={[{ required: true, message: 'Chọn tháng bắt đầu.' }]}
                    >
                        <DatePicker
                            picker="month"
                            format="MM/YYYY"
                            placeholder="MM/YYYY"
                            style={{ width: '100%' }}
                            disabledDate={date => date.isAfter(dayjs())}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Đến tháng"
                        name="to"
                        dependencies={['from', 'current']}
                        rules={[
                            ({ getFieldValue }) => ({
                                validator: (_, to?: Dayjs) => {
                                    if (getFieldValue('current')) return Promise.resolve();
                                    if (!to)
                                        return Promise.reject(new Error('Chọn tháng kết thúc hoặc đánh dấu đang làm.'));
                                    const from = getFieldValue('from') as Dayjs | undefined;
                                    return from && to.isBefore(from, 'month')
                                        ? Promise.reject(new Error('Phải sau tháng bắt đầu.'))
                                        : Promise.resolve();
                                },
                            }),
                        ]}
                    >
                        <DatePicker
                            picker="month"
                            format="MM/YYYY"
                            placeholder="MM/YYYY"
                            style={{ width: '100%' }}
                            disabled={current}
                            disabledDate={date => date.isAfter(dayjs())}
                        />
                    </Form.Item>
                </div>
                <Form.Item name="current" valuePropName="checked">
                    <Checkbox
                        onChange={event => {
                            setCurrent(event.target.checked);
                            if (event.target.checked) form.setFieldValue('to', undefined);
                        }}
                    >
                        Tôi đang làm việc ở đây
                    </Checkbox>
                </Form.Item>
                <Form.Item
                    label="Mô tả công việc"
                    name="description"
                    rules={[{ max: 2000, message: 'Tối đa 2000 ký tự.' }]}
                >
                    <Input.TextArea
                        rows={4}
                        maxLength={2000}
                        showCount
                        placeholder="Trách nhiệm chính, thành tựu, công nghệ đã dùng…"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

// ---------- Skills: type + Enter to add, tap a suggestion, × to remove ----------
const LEVEL_TIPS = ['Cơ bản', 'Khá', 'Tốt', 'Rất tốt', 'Chuyên gia'];

export const SkillsModal = ({
    open,
    onClose,
    skills,
    onSave,
}: BaseProps & { skills: IProfileSkill[]; onSave: Save<IProfileSkill[]> }) => {
    const [items, setItems] = useState<IProfileSkill[]>(skills);
    const [text, setText] = useState('');
    const [saving, setSaving] = useState(false);
    const catalog = useRequest(() => (open ? callFetchAllSkill('page=1&size=100&sort=name,asc') : null), [open]);

    useEffect(() => {
        if (open) {
            setItems(skills);
            setText('');
        }
    }, [open, skills]);

    const has = (name: string) => items.some(item => item.name.toLowerCase() === name.toLowerCase());
    const add = (raw: string) => {
        const name = raw.trim().slice(0, 60);
        if (!name || has(name) || items.length >= 30) return;
        setItems(current => [...current, { name, level: 3 }]);
        setText('');
    };
    const suggestions = [...SOFT_SKILL_SUGGESTIONS, ...(catalog.data?.result.map(skill => skill.name as string) ?? [])]
        .filter(name => name && !has(name))
        .slice(0, 14);

    const submit = async () => {
        setSaving(true);
        const ok = await onSave(items);
        setSaving(false);
        if (ok) onClose();
    };

    return (
        <Modal
            {...modalProps}
            title="Kỹ năng"
            open={open}
            onCancel={onClose}
            onOk={submit}
            confirmLoading={saving}
            width={600}
        >
            <div className={p.skillEditor}>
                <Input
                    value={text}
                    onChange={event => setText(event.target.value)}
                    onPressEnter={event => {
                        event.preventDefault();
                        add(text);
                    }}
                    placeholder="Gõ tên kỹ năng rồi nhấn Enter"
                    maxLength={60}
                    suffix={
                        <Button type="text" size="small" onClick={() => add(text)} disabled={!text.trim()}>
                            Thêm
                        </Button>
                    }
                />
                {suggestions.length > 0 && (
                    <div className={p.suggestions}>
                        <small>Gợi ý nhanh</small>
                        <div>
                            {suggestions.map(name => (
                                <button key={name} type="button" onClick={() => add(name)}>
                                    <PlusOutlined aria-hidden="true" /> {name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {items.length === 0 ? (
                    <p className={p.emptyNote}>Chưa có kỹ năng nào. Hãy thêm các kỹ năng nổi bật của bạn.</p>
                ) : (
                    <ul className={p.skillList}>
                        {items.map(item => (
                            <li key={item.name}>
                                <span>{item.name}</span>
                                <Rate
                                    count={5}
                                    value={item.level}
                                    tooltips={LEVEL_TIPS}
                                    onChange={level =>
                                        setItems(current =>
                                            current.map(skill =>
                                                skill.name === item.name ? { ...skill, level: level || 1 } : skill,
                                            ),
                                        )
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setItems(current => current.filter(skill => skill.name !== item.name))
                                    }
                                    aria-label={`Xóa kỹ năng ${item.name}`}
                                >
                                    <CloseOutlined />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <small className={p.counter}>{items.length}/30 kỹ năng</small>
            </div>
        </Modal>
    );
};

// ---------- References ----------
export const ReferenceModal = ({
    open,
    onClose,
    value,
    onSave,
}: BaseProps & { value: IProfileReference | null; onSave: Save<IProfileReference> }) => {
    const [form] = Form.useForm<IProfileReference>();
    const [saving, setSaving] = useState(false);
    const submit = async (values: IProfileReference) => {
        setSaving(true);
        const ok = await onSave({
            name: values.name.trim(),
            title: values.title?.trim() ?? '',
            company: values.company?.trim() ?? '',
            phone: values.phone?.trim() ?? '',
            email: values.email?.trim() ?? '',
        });
        setSaving(false);
        if (ok) onClose();
    };
    return (
        <Modal
            {...modalProps}
            title={value ? 'Sửa người tham khảo' : 'Thêm người tham khảo'}
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
            confirmLoading={saving}
            width={560}
        >
            <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                preserve={false}
                onFinish={submit}
                initialValues={value ?? {}}
            >
                <Form.Item
                    label="Họ và tên"
                    name="name"
                    rules={[
                        { required: true, whitespace: true, message: 'Vui lòng nhập họ tên.' },
                        { max: 100, message: 'Tối đa 100 ký tự.' },
                    ]}
                >
                    <Input placeholder="Nguyễn Văn B" />
                </Form.Item>
                <div className={p.formRow}>
                    <Form.Item label="Chức vụ" name="title" rules={[{ max: 100, message: 'Tối đa 100 ký tự.' }]}>
                        <Input placeholder="Trưởng nhóm" />
                    </Form.Item>
                    <Form.Item label="Công ty" name="company" rules={[{ max: 100, message: 'Tối đa 100 ký tự.' }]}>
                        <Input placeholder="Tên công ty" />
                    </Form.Item>
                </div>
                <div className={p.formRow}>
                    <Form.Item label="Số điện thoại" name="phone" rules={[{ max: 30, message: 'Tối đa 30 ký tự.' }]}>
                        <Input placeholder="09xx xxx xxx" />
                    </Form.Item>
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { type: 'email', message: 'Email chưa hợp lệ.' },
                            { max: 120, message: 'Tối đa 120 ký tự.' },
                        ]}
                    >
                        <Input placeholder="email@congty.com" />
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    );
};
