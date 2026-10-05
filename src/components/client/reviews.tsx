import { FormEvent, useEffect, useState } from 'react';
import { Alert, Button, Input, Popconfirm, Rate, message } from 'antd';
import { MessageOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import { callDeleteMyReview, callFetchCompanyReviews, callFetchMyReview, callSaveMyReview } from '@/config/api';
import { useRequest } from '@/config/use-request';
import { formatDate } from '@/config/utils';
import { useAppSelector, useIsEmployer } from '@/redux/hooks';
import { IReview } from '@/types/backend';
import { StatePanel } from './decor';
import { AuthLink } from './auth';
import { VipBadge, VipFrame } from './vip';
import UserAvatar from './avatar';
import ui from '@/styles/client.module.scss';
import d from '@/styles/detail.module.scss';

const errorText = (value: unknown) => (Array.isArray(value) ? value[0] : value) as string | undefined;

const ReviewForm = ({ companyId, mine, onChanged }: { companyId: string; mine?: IReview; onChanged: () => void }) => {
    const [rating, setRating] = useState(0);
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setRating(mine?.rating ?? 0);
        setContent(mine?.content ?? '');
        setError('');
    }, [mine?.id, mine?.updatedAt]);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!rating) return setError('Vui lòng chọn số sao cho công ty.');
        if (!content.trim()) return setError('Hãy chia sẻ đôi dòng về trải nghiệm của bạn.');
        setSaving(true);
        setError('');
        try {
            const res = await callSaveMyReview(companyId, rating, content.trim());
            if (!res.data) throw new Error(errorText(res.message));
            message.success(mine ? 'Đã cập nhật đánh giá của bạn.' : 'Cảm ơn bạn đã chia sẻ đánh giá!');
            onChanged();
        } catch (saveError) {
            setError((saveError instanceof Error && saveError.message) || 'Chưa thể lưu đánh giá. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        try {
            const res = await callDeleteMyReview(companyId);
            if (+res.statusCode !== 200) throw new Error();
            message.success('Đã xóa đánh giá của bạn.');
            onChanged();
        } catch {
            message.error('Chưa thể xóa đánh giá. Vui lòng thử lại.');
        }
    };

    return (
        <form className={d.reviewForm} onSubmit={submit}>
            <h3>{mine ? 'Đánh giá của bạn' : 'Viết đánh giá'}</h3>
            <div className={d.reviewRate}>
                <span id={`rate-${companyId}`}>Mức độ hài lòng</span>
                <Rate value={rating} onChange={setRating} aria-labelledby={`rate-${companyId}`} />
            </div>
            <label htmlFor={`review-${companyId}`} className="sr-only">
                Nội dung đánh giá
            </label>
            <Input.TextArea
                id={`review-${companyId}`}
                value={content}
                onChange={event => setContent(event.target.value)}
                maxLength={1000}
                showCount
                autoSize={{ minRows: 3, maxRows: 8 }}
                placeholder="Môi trường làm việc, quy trình tuyển dụng, đồng nghiệp… điều gì khiến bạn ấn tượng?"
            />
            {error && <Alert type="error" showIcon message={error} />}
            <div className={d.reviewFormActions}>
                {mine && (
                    <Popconfirm title="Xóa đánh giá của bạn?" okText="Xóa" cancelText="Hủy" onConfirm={remove}>
                        <Button danger type="text">
                            Xóa đánh giá
                        </Button>
                    </Popconfirm>
                )}
                <Button type="primary" htmlType="submit" loading={saving}>
                    {mine ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                </Button>
            </div>
        </form>
    );
};

interface IProps {
    companyId: string;
    companyName?: string;
    onSummary?: (summary: { average: number; total: number }) => void;
}

const CompanyReviews = ({ companyId, companyName, onSummary }: IProps) => {
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const isEmployer = useIsEmployer();
    const [pageSize, setPageSize] = useState(5);
    const [version, setVersion] = useState(0);
    const reviews = useRequest(
        () => callFetchCompanyReviews(companyId, `page=1&size=${pageSize}`),
        [companyId, pageSize, version],
    );
    const mine = useRequest(
        () => (isAuthenticated && !isEmployer ? callFetchMyReview(companyId) : null),
        [companyId, isAuthenticated, version],
    );
    const data = reviews.data;

    useEffect(() => {
        if (data) onSummary?.({ average: data.average, total: data.total });
    }, [data, onSummary]);

    if (reviews.loading && !data)
        return <div className={d.reviewSkeleton} aria-busy="true" aria-label="Đang tải đánh giá" />;
    if (reviews.error || !data) {
        return (
            <StatePanel
                compact
                icon={<ReloadOutlined />}
                title="Chưa tải được đánh giá"
                action={
                    <button type="button" className={ui.btnOutline} onClick={reviews.retry}>
                        Thử lại
                    </button>
                }
            />
        );
    }

    return (
        <div className={d.reviews}>
            <div className={d.reviewSummary}>
                <div className={d.reviewScore}>
                    <strong>{data.total ? data.average.toFixed(1) : '—'}</strong>
                    <Rate disabled allowHalf value={data.average} className={d.reviewStars} />
                    <span>{data.total ? `${data.total} đánh giá` : 'Chưa có đánh giá'}</span>
                    <span className="sr-only">Điểm trung bình {data.average} trên 5</span>
                </div>
                <ul className={d.reviewBars}>
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = data.distribution[star] ?? 0;
                        const percent = data.total ? Math.round((count * 100) / data.total) : 0;
                        return (
                            <li key={star} aria-label={`${star} sao: ${count} đánh giá`}>
                                <span aria-hidden="true">
                                    {star} <StarFilled />
                                </span>
                                <span className={d.bar} aria-hidden="true">
                                    <span style={{ width: `${percent}%` }} />
                                </span>
                                <span aria-hidden="true">{percent}%</span>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {isEmployer ? (
                <p className={d.reviewEmpty}>
                    Đánh giá công ty do ứng viên viết; tài khoản nhà tuyển dụng không thể đánh giá.
                </p>
            ) : isAuthenticated ? (
                !mine.loading && (
                    <ReviewForm
                        companyId={companyId}
                        mine={mine.data ?? undefined}
                        onChanged={() => setVersion(value => value + 1)}
                    />
                )
            ) : (
                <div className={d.reviewGuest}>
                    <MessageOutlined aria-hidden="true" />
                    <p>
                        Bạn từng làm việc hoặc phỏng vấn tại {companyName || 'công ty này'}? Chia sẻ trải nghiệm để giúp
                        ứng viên khác.
                    </p>
                    <AuthLink mode="login" className={ui.btnPrimarySm}>
                        Đăng nhập để đánh giá
                    </AuthLink>
                </div>
            )}

            {data.result.length === 0 ? (
                <p className={d.reviewEmpty}>
                    Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ trải nghiệm về {companyName || 'công ty này'}.
                </p>
            ) : (
                <ul className={d.reviewList}>
                    {data.result.map(review => (
                        <li key={review.id}>
                            <VipFrame vip={review.vip} className={d.reviewVip}>
                                <UserAvatar
                                    name={review.user.name}
                                    avatar={review.userAvatar}
                                    className={d.reviewAvatar}
                                />
                            </VipFrame>
                            <div>
                                <div className={d.reviewMeta}>
                                    <strong>{review.user.name}</strong>
                                    {review.vip && <VipBadge promo />}
                                    <span className={d.reviewMiniStars} aria-label={`${review.rating} trên 5 sao`}>
                                        <StarFilled aria-hidden="true" /> {review.rating}.0
                                    </span>
                                    <time dateTime={review.updatedAt}>{formatDate(review.updatedAt)}</time>
                                </div>
                                <p>{review.content}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {data.meta.total > data.result.length && (
                <button
                    type="button"
                    className={d.moreReviews}
                    onClick={() => setPageSize(size => size + 5)}
                    disabled={reviews.loading}
                >
                    {reviews.loading ? 'Đang tải…' : `Xem thêm đánh giá (${data.meta.total - data.result.length})`}
                </button>
            )}
        </div>
    );
};

export default CompanyReviews;
