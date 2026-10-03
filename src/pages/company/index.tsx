import { CSSProperties, FormEvent, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid, Pagination } from 'antd';
import { BankOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { sfLike } from 'spring-filter-query-builder';
import { callFetchCompany } from '@/config/api';
import { pageItemRender } from '@/components/client/page-nav';
import { useRequest } from '@/config/use-request';
import { escapeFilter } from '@/config/utils';
import CompanyCard from '@/components/client/card/company.card';
import { AssetImage, Sparkle, StatePanel } from '@/components/client/decor';
import { ASSETS } from '@/config/assets';
import ui from '@/styles/client.module.scss';
import d from '@/styles/discovery.module.scss';

const PAGE_SIZE = 9;

const ClientCompanyPage = () => {
    const [params, setParams] = useSearchParams();
    const phone = !Grid.useBreakpoint().sm;
    const q = params.get('q')?.trim() ?? '';
    const page = Math.max(1, Number(params.get('page')) || 1);
    const [keyword, setKeyword] = useState(q);
    const listTop = useRef<HTMLDivElement>(null);
    useEffect(() => setKeyword(q), [q]);

    const companies = useRequest(() => {
        const query = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE), sort: 'createdAt,desc' });
        query.set(
            'filter',
            ['approved : true', q ? sfLike('name', escapeFilter(q.slice(0, 120)), true).toString() : '']
                .filter(Boolean)
                .join(' and '),
        );
        return callFetchCompany(query.toString());
    }, [q, page]);
    const total = companies.data?.meta.total ?? 0;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        setParams(keyword.trim() ? { q: keyword.trim() } : {});
    };

    return (
        <div className={d.page}>
            <section className={d.hero} aria-labelledby="companies-title">
                <Sparkle className={d.heroSparkleA} />
                <Sparkle className={d.heroSparkleB} />
                <AssetImage asset={ASSETS.explorerLeft} className={d.heroIllustrationLeft} />
                <AssetImage asset={ASSETS.explorerRight} className={d.heroIllustrationRight} />
                <div className={ui.container}>
                    <h1 id="companies-title" className="enter">
                        Khám phá <span>nhà tuyển dụng</span>
                    </h1>
                    <p className="enter" style={{ '--i': 1 } as CSSProperties}>
                        Tìm hiểu doanh nghiệp, đọc đánh giá từ cộng đồng và chọn nơi bạn muốn gắn bó lâu dài.
                    </p>
                    <form
                        className={`${d.heroSearch} enter`}
                        style={{ '--i': 2 } as CSSProperties}
                        onSubmit={submit}
                        role="search"
                    >
                        <label htmlFor="company-search" className="sr-only">
                            Tên công ty
                        </label>
                        <input
                            id="company-search"
                            value={keyword}
                            onChange={event => setKeyword(event.target.value)}
                            placeholder="Nhập tên công ty…"
                            maxLength={120}
                        />
                        <button type="submit" className={ui.btnPrimarySm}>
                            <SearchOutlined aria-hidden="true" /> Tìm kiếm
                        </button>
                    </form>
                </div>
            </section>

            <section className={`${ui.container} ${d.companyBody}`} aria-label="Danh sách công ty">
                <div className={d.listHead} ref={listTop}>
                    <p aria-live="polite">
                        {companies.loading ? (
                            'Đang tải công ty…'
                        ) : (
                            <>
                                Hiển thị <strong>{total.toLocaleString('vi-VN')}</strong> công ty
                                {q ? <> cho “{q}”</> : null}
                            </>
                        )}
                    </p>
                    {q && (
                        <button type="button" className={d.textButton} onClick={() => setParams({})}>
                            Xóa tìm kiếm
                        </button>
                    )}
                </div>
                {companies.loading ? (
                    <div className={d.companyGrid} aria-busy="true">
                        {Array.from({ length: 6 }, (_, index) => (
                            <div key={index} className={d.skeletonCard} />
                        ))}
                    </div>
                ) : companies.error ? (
                    <StatePanel
                        icon={<ReloadOutlined />}
                        title="Chưa thể tải danh sách công ty"
                        text="Vui lòng kiểm tra kết nối và thử lại."
                        action={
                            <button type="button" className={ui.btnOutline} onClick={companies.retry}>
                                Thử lại
                            </button>
                        }
                    />
                ) : total === 0 ? (
                    <StatePanel
                        icon={<BankOutlined />}
                        title={q ? 'Chưa tìm thấy công ty phù hợp' : 'Danh sách công ty đang được cập nhật'}
                        text={
                            q
                                ? 'Thử tìm bằng tên viết tắt hoặc một từ khóa khác.'
                                : 'Hãy quay lại sau để khám phá nhà tuyển dụng trên itjobs.'
                        }
                    />
                ) : (
                    <div className={d.companyGrid}>
                        {companies.data?.result.map((company, index) => (
                            <div key={company.id} className="reveal" style={{ '--i': index % 3 } as CSSProperties}>
                                <CompanyCard company={company} />
                            </div>
                        ))}
                    </div>
                )}
                {!companies.loading && total > PAGE_SIZE && (
                    <Pagination
                        className={d.pagination}
                        simple={phone}
                        current={page}
                        total={total}
                        pageSize={PAGE_SIZE}
                        showSizeChanger={false}
                        onChange={next => {
                            setParams(q ? { q, page: String(next) } : { page: String(next) });
                            listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        itemRender={pageItemRender}
                    />
                )}
            </section>
        </div>
    );
};

export default ClientCompanyPage;
