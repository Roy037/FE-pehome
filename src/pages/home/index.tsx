import { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Select } from 'antd';
import CountUp from '@/components/share/count-up';
import { BsBriefcase, BsCodeSlash, BsDatabase, BsQuote } from 'react-icons/bs';
import {
    ArrowRightOutlined,
    ArrowUpOutlined,
    ClockCircleOutlined,
    DownOutlined,
    EnvironmentOutlined,
    StarFilled,
    FileDoneOutlined,
    FileSearchOutlined,
    MailOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    UserAddOutlined,
} from '@ant-design/icons';
import { callFetchAllSkill, callFetchCompany, callFetchJob } from '@/config/api';
import { useRequest } from '@/config/use-request';
import {
    EMPLOYMENT_TYPE_LIST,
    companyPath,
    formatSalary,
    getCityName,
    isNegotiable,
    jobPath,
    labelOf,
    openJobsFilter,
} from '@/config/utils';
import { useAppSelector } from '@/redux/hooks';
import { IJob } from '@/types/backend';
import Carousel from '@/components/client/carousel';
import Coverflow from '@/components/client/coverflow';
import CompanyLogo from '@/components/client/card/company-logo';
import { JobCard } from '@/components/client/card/job.card';
import { JobByEmail, useAccountModal } from '@/components/client/modal/manage.account';
import { AuthLink, useAuthClick, useAuthModal } from '@/components/client/auth';
import { AssetImage, RotatingBadge, Sparkle, StatePanel } from '@/components/client/decor';
import { ASSETS } from '@/config/assets';
import { useReducedMotion } from '@/config/motion';
import { SparkleField, usePointerDepth } from '@/components/client/hero-effects';
import ui from '@/styles/client.module.scss';
import s from '@/styles/home.module.scss';

const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();

const fetchHeroJobs = (salaryField: 'salary' | 'salaryMax') => {
    const query = new URLSearchParams({
        page: '1',
        size: '2',
        filter: `${openJobsFilter()} and company.approved : true and (salary > 0 or salaryMax > 0)`,
    });
    query.append('sort', `${salaryField},desc`);
    query.append('sort', `${salaryField === 'salary' ? 'salaryMax' : 'salary'},desc`);
    query.append('sort', 'createdAt,desc');
    query.append('sort', 'id,desc');
    return callFetchJob(query.toString());
};

const featuredArticles = [
    {
        title: 'AI đang thay đổi cách lập trình viên chọn công nghệ',
        summary: 'Từ ngôn ngữ đến công cụ: dữ liệu Octoverse cho thấy AI đang tác động tới lựa chọn của developer.',
        category: 'AI & lập trình',
        source: 'GitHub Blog',
        period: '19/02/2026',
        href: 'https://github.blog/ai-and-ml/generative-ai/how-ai-is-reshaping-developer-choice-and-octoverse-data-proves-it/',
        image: 'https://github.blog/wp-content/uploads/2026/01/4ba0cd42388a255e04c78e5143548f22e577d68e0f15f68e6a3c76c18b927981-1920x1080-1.png?fit=1920%2C1080',
    },
    {
        title: 'Lương và tuyển dụng IT Việt Nam 2025–2026',
        summary:
            'Tham khảo mức lương theo vị trí, kinh nghiệm và những thay đổi trong nhu cầu tuyển dụng tại Việt Nam.',
        category: 'Thị trường Việt Nam',
        source: 'ITviec',
        period: '2025–2026',
        href: 'https://itviec.com/bao-cao/luong-it-va-thi-truong-tuyen-dung-it-vietnam',
        image: 'https://itviec.com/assets/salary_report/landing_page/2025-social-share-vi-b5c23138615e55565e9c2f0ef630be6f7bb2f4dbea3601e176238bdfc1e240a6.jpg',
    },
    {
        title: 'Tuyển dụng IT 2026: doanh nghiệp đang thiếu kỹ năng nào?',
        summary:
            'Linux Foundation phân tích khoảng trống kỹ năng, mức độ sẵn sàng về bảo mật và nhu cầu đào tạo nhân sự IT.',
        category: 'Tuyển dụng & kỹ năng',
        source: 'Linux Foundation',
        period: 'Báo cáo 2026',
        href: 'https://www.linuxfoundation.org/research/open-source-jobs-report-2026',
        image: 'https://www.linuxfoundation.org/hubfs/Research%20Reports/2026-Tech-Talent-Global-Report-WebAssets_featured_image.png',
    },
    {
        title: 'Kỹ năng nghề nghiệp nào được chú trọng trong năm 2026?',
        summary:
            'Job Skills Report 2026 tổng hợp xu hướng học tập và những kỹ năng đang định hình công việc trong thời đại AI.',
        category: 'Học tập & phát triển',
        source: 'Coursera',
        period: '21/01/2026',
        href: 'https://blog.coursera.org/introducing-courseras-job-skills-report-2026-the-most-critical-skills-the-worlds-learners-need-this-year/',
        image: 'https://blog.coursera.org/wp-content/uploads/2026/03/BC-5401-PR-Comms-JSR-2026_blog-header_1500x680-1.png',
    },
    {
        title: 'AI, dữ liệu và phần mềm: triển vọng việc làm đến 2030',
        summary: 'Future of Jobs 2025 phân tích các nhóm nghề tăng trưởng và sự dịch chuyển của thị trường lao động.',
        category: 'Xu hướng nghề nghiệp',
        source: 'World Economic Forum',
        period: 'Báo cáo 2025',
        href: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/2-jobs-outlook/',
        image: '/images/detail-banner.webp',
    },
    {
        title: 'Những kỹ năng cần chuẩn bị cho chặng đường tiếp theo',
        summary: 'AI, dữ liệu lớn và tư duy phân tích nằm trong những nhóm kỹ năng được doanh nghiệp chú trọng.',
        category: 'Phát triển kỹ năng',
        source: 'World Economic Forum',
        period: 'Báo cáo 2025',
        href: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/3-skills-outlook/',
        image: '/images/career-workspace.webp',
    },
    {
        title: 'Dùng AI viết code: vì sao developer vẫn cần kiểm chứng?',
        summary:
            'Stack Overflow bàn về khoảng cách giữa sử dụng và tin tưởng AI, cùng vai trò của kỹ năng nền tảng và review code.',
        category: 'AI trong công việc',
        source: 'Stack Overflow',
        period: '18/02/2026',
        href: 'https://stackoverflow.blog/2026/02/18/closing-the-developer-ai-trust-gap/',
        image: 'https://cdn.stackoverflow.co/images/jo7n4k8s/production/2b91cb6c6784765415373bfd00ceba147404ecb4-12000x6293.jpg?rect=7,0,11987,6293&w=1200&h=630&auto=format',
    },
    {
        title: 'Lương, kinh nghiệm và cách làm việc của developer',
        summary:
            'Khảo sát Developer Survey 2025 cung cấp góc nhìn về thu nhập, hình thức làm việc và trải nghiệm nghề nghiệp.',
        category: 'Đời sống developer',
        source: 'Stack Overflow',
        period: 'Khảo sát 2025',
        href: 'https://survey.stackoverflow.co/2025/work',
        image: 'https://survey.stackoverflow.co/2025/img/stackoverflow-dev-survey-og.png',
    },
];

const guides = [
    {
        title: 'Viết CV đúng trọng tâm',
        short: 'Chọn lọc kinh nghiệm liên quan tới vị trí bạn nhắm tới.',
        body: 'Nhà tuyển dụng thường chỉ dành vài chục giây cho lần đọc đầu tiên. Hãy đặt kinh nghiệm liên quan nhất lên đầu, mô tả kết quả bằng con số cụ thể và điều chỉnh phần kỹ năng theo từng tin tuyển dụng. Lưu CV dưới dạng PDF để giữ nguyên định dạng khi gửi.',
    },
    {
        title: 'Tìm việc thông minh hơn',
        short: 'Lọc theo kỹ năng, mức lương và hình thức làm việc.',
        body: 'Bắt đầu từ kỹ năng bạn giỏi nhất rồi thu hẹp theo địa điểm, cấp bậc và hình thức làm việc. Lưu lại những vị trí đáng cân nhắc để so sánh sau, và đăng ký nhận thông tin việc làm theo kỹ năng để không bỏ lỡ cơ hội mới.',
    },
    {
        title: 'Tìm hiểu kỹ nhà tuyển dụng',
        short: 'Đọc hồ sơ công ty và đánh giá từ ứng viên khác.',
        body: 'Trước khi ứng tuyển, hãy đọc phần giới thiệu công ty, xem các vị trí họ đang tuyển và tham khảo đánh giá của cộng đồng. Hiểu sản phẩm và văn hóa làm việc giúp bạn viết thư ứng tuyển thuyết phục và biết mình có thật sự phù hợp.',
    },
    {
        title: 'Chuẩn bị cho buổi phỏng vấn',
        short: 'Kể câu chuyện của bạn theo cấu trúc rõ ràng.',
        body: 'Chuẩn bị 3–4 câu chuyện thể hiện năng lực theo cấu trúc Tình huống – Nhiệm vụ – Hành động – Kết quả. Luyện nói thành tiếng, tìm hiểu người phỏng vấn nếu có thể, và chuẩn bị sẵn câu hỏi về công việc, đội ngũ và lộ trình phát triển.',
    },
];

const faqs = [
    {
        q: 'Làm thế nào để ứng tuyển một công việc?',
        a: 'Mở trang chi tiết việc làm và chọn “Ứng tuyển ngay”. Tải CV lên (PDF, tối đa 5 MB) hoặc dán liên kết Google Drive, Dropbox, OneDrive, có thể kèm thư xin việc, rồi gửi hồ sơ. Bạn cần đăng nhập để ứng tuyển.',
    },
    {
        q: 'Tôi theo dõi hồ sơ đã gửi ở đâu?',
        a: 'Chọn ảnh đại diện ở góc phải, sau đó chọn “Hồ sơ & ứng tuyển”. Trạng thái hồ sơ (đang chờ, đang xem xét, được chấp nhận, chưa phù hợp) được cập nhật khi nhà tuyển dụng xử lý.',
    },
    {
        q: 'Làm sao để lưu việc làm yêu thích?',
        a: 'Nhấn biểu tượng dấu trang trên thẻ việc làm hoặc trên trang chi tiết. Danh sách việc làm đã lưu nằm ở biểu tượng dấu trang trên thanh điều hướng.',
    },
    {
        q: 'Làm thế nào để nhận việc làm mới qua email?',
        a: 'Vào “Hồ sơ & ứng tuyển” → “Nhận việc làm qua email” và chọn những kỹ năng bạn quan tâm. Bạn có thể cập nhật danh sách kỹ năng bất cứ lúc nào.',
    },
    {
        q: 'Đánh giá công ty hoạt động như thế nào?',
        a: 'Mỗi tài khoản có thể viết một đánh giá từ 1 đến 5 sao cho mỗi công ty, và chỉnh sửa hoặc xóa đánh giá của mình bất cứ lúc nào. Đánh giá hiển thị trên trang công ty và trên các tin tuyển dụng của công ty đó.',
    },
];

// Sample copy: replace with real feedback (and real roles) before publishing. zoom/focus crop each photo onto the face.
const testimonials = [
    {
        tag: 'Dễ sử dụng & hiệu quả',
        quote: 'itjobs giúp tôi lọc việc làm theo kỹ năng rất nhanh, nộp CV chỉ trong vài bước. Giao diện gọn gàng nên việc tìm việc nhẹ nhàng hơn hẳn.',
        name: 'Nguyễn Hoàng Minh',
        role: 'Frontend Engineer tại Netflix',
        photo: '/images/testimonial-minh.webp',
        zoom: '200%',
        focus: '48% 2%',
    },
    {
        tag: 'Đơn giản & mạnh mẽ',
        quote: 'Lưu việc làm yêu thích và đọc đánh giá công ty trước khi ứng tuyển giúp tôi tự tin hơn khi chọn nơi gửi hồ sơ.',
        name: 'Nguyễn Thái Gia Lu',
        role: 'Backend Engineer tại Microsoft',
        photo: '/images/testimonial-hu.webp',
        zoom: '170%',
        focus: '52% 11%',
    },
    {
        tag: 'Quy trình tuyển dụng gọn gàng',
        quote: 'Trang quản trị rất dễ dùng: đăng tin, theo dõi hồ sơ và cập nhật trạng thái ứng viên ngay trên một màn hình.',
        name: 'Vũ Tuấn Kiệt',
        role: 'HR tại MoMo',
        photo: '/images/testimonial-kiet.webp',
        zoom: '180%',
        focus: '57% 30%',
    },
];

const steps = [
    { title: 'Tạo tài khoản', icon: <UserAddOutlined />, to: '/register' },
    { title: 'Tìm việc làm', icon: <FileSearchOutlined />, to: '/job' },
    { title: 'Ứng tuyển', icon: <FileDoneOutlined />, to: '/job' },
    { title: 'Bắt đầu làm việc', icon: <BsBriefcase />, to: '/job' },
];

const careerRoad =
    'M-30 155 C65 155 65 45 150 45 C225 45 285 100 300 150 C315 205 350 255 450 255 C545 255 585 205 600 150 C615 95 660 45 750 45 C840 45 885 95 900 150 C915 205 955 255 1050 255 C1145 255 1135 155 1230 155';
const startCareerFlight = (node: SVGElement | null) => (node as SVGAnimationElement | null)?.beginElement();

const Marquee = ({ items, variant }: { items: string[]; variant: string }) => {
    const unit = items.length ? Array.from({ length: Math.ceil(10 / items.length) }, () => items).flat() : [];
    if (!unit.length) return null;
    return (
        <div className={`${s.band} ${variant}`} aria-hidden="true">
            <div className={s.bandTrack}>
                {[...unit, ...unit].map((item, index) => (
                    <span key={index}>
                        {item}
                        <Sparkle className={s.bandStar} />
                    </span>
                ))}
            </div>
        </div>
    );
};

const HeroFloatCard = ({ job, className }: { job: IJob; className: string }) => {
    const type = labelOf(EMPLOYMENT_TYPE_LIST, job.employmentType);
    return (
        <Link to={jobPath(job)} className={`${s.floatCard} ${className}`}>
            <div className={s.floatHead}>
                <CompanyLogo name={job.company?.name} logo={job.company?.logo} size={36} />
                <div>
                    <strong title={job.name}>{job.name}</strong>
                    <span>{job.company?.name}</span>
                </div>
            </div>
            <div className={s.floatMeta}>
                {type && (
                    <span>
                        <ClockCircleOutlined aria-hidden="true" />
                        {type}
                    </span>
                )}
                <span>
                    <EnvironmentOutlined aria-hidden="true" />
                    {getCityName(job.location)}
                </span>
            </div>
            <strong className={s.floatSalary}>
                {formatSalary(job.salary, job.salaryMax, true)}
                {!isNegotiable(job.salary, job.salaryMax) && <small>/ tháng</small>}
            </strong>
        </Link>
    );
};

const HomePage = () => {
    const navigate = useNavigate();
    const openAccount = useAccountModal();
    const registerClick = useAuthClick('register');
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const [keyword, setKeyword] = useState('');
    const [skill, setSkill] = useState<string>();
    const heroRef = useRef<HTMLElement>(null);
    const reduced = useReducedMotion();
    usePointerDepth(heroRef);
    const [guide, setGuide] = useState(0);
    const metricsRef = useRef<HTMLElement>(null);
    const [metricsVisible, setMetricsVisible] = useState(false);
    const pathRef = useRef<HTMLDivElement>(null);
    const [pathVisible, setPathVisible] = useState(false);
    const testimonialsRef = useRef<HTMLElement>(null);
    const [testimonialsIn, setTestimonialsIn] = useState(false);

    useEffect(() => {
        const path = pathRef.current;
        if (!path) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setPathVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.35 },
        );
        observer.observe(path);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const section = testimonialsRef.current;
        if (!section) return;
        if (reduced || typeof IntersectionObserver === 'undefined') {
            setTestimonialsIn(true);
            return;
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTestimonialsIn(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.25 },
        );
        observer.observe(section);
        return () => observer.disconnect();
    }, [reduced]);

    useEffect(() => {
        const section = metricsRef.current;
        if (!section) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setMetricsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.35 },
        );
        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    // ponytail: category counts come from the newest 100 active jobs; add a per-skill count API if listings outgrow that.
    const jobs = useRequest(
        () =>
            callFetchJob(
                new URLSearchParams({
                    page: '1',
                    size: '100',
                    sort: 'createdAt,desc',
                    filter: openJobsFilter(),
                }).toString(),
            ),
        [],
    );
    const weekly = useRequest(
        () =>
            callFetchJob(
                new URLSearchParams({
                    page: '1',
                    size: '1',
                    filter: `${openJobsFilter()} and createdAt > '${weekAgo}'`,
                }).toString(),
            ),
        [],
    );
    const companies = useRequest(
        () => callFetchCompany(`page=1&size=20&sort=createdAt,desc&filter=${encodeURIComponent('approved : true')}`),
        [],
    );
    const skills = useRequest(() => callFetchAllSkill('page=1&size=100&sort=name,asc'), []);
    const highestCeilings = useRequest(() => fetchHeroJobs('salaryMax'), []);
    const highestFloors = useRequest(() => fetchHeroJobs('salary'), []);

    // Query both salary columns so a high-paying "Từ ..." listing with no maximum is still eligible.
    const heroJobs = useMemo(() => {
        const candidates = [...(highestCeilings.data?.result ?? []), ...(highestFloors.data?.result ?? [])];
        return [...new Map(candidates.map(job => [job.id, job])).values()]
            .sort(
                (a, b) =>
                    Math.max(b.salary, b.salaryMax ?? 0) - Math.max(a.salary, a.salaryMax ?? 0) ||
                    b.salary - a.salary ||
                    new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime() ||
                    Number(b.id) - Number(a.id),
            )
            .slice(0, 2);
    }, [highestCeilings.data, highestFloors.data]);

    const jobList = useMemo(() => jobs.data?.result ?? [], [jobs.data]);
    const companyList = companies.data?.result ?? [];
    const categories = useMemo(
        () =>
            (skills.data?.result ?? [])
                .map(skill => ({
                    ...skill,
                    count: jobList.filter(job => job.skills?.some(item => String(item.id) === String(skill.id))).length,
                }))
                .sort((a, b) => b.count - a.count),
        [skills.data, jobList],
    );

    const stats = [
        { label: 'Việc làm đang tuyển', value: jobs.data?.meta.total },
        { label: 'Tin mới trong 7 ngày', value: weekly.data?.meta.total },
        { label: 'Nhà tuyển dụng', value: companies.data?.meta.total },
        { label: 'Danh mục kỹ năng', value: skills.data?.meta.total },
    ];

    const search = (event: FormEvent) => {
        event.preventDefault();
        const params = new URLSearchParams();
        if (keyword.trim()) params.set('q', keyword.trim());
        if (skill) params.set('skills', skill);
        navigate(`/job${params.size ? `?${params}` : ''}`);
    };

    return (
        <>
            {/* Hero */}
            <section ref={heroRef} className={s.hero} aria-labelledby="hero-title">
                <SparkleField containerRef={heroRef} />
                <Sparkle className={s.sparkleHero1} emit />
                <Sparkle className={s.sparkleHero2} />
                <div className={`${ui.container} ${s.heroGrid}`}>
                    <div className={s.heroCopy}>
                        <h1 id="hero-title" className="enter" style={{ '--i': 1 } as CSSProperties}>
                            Tìm công việc hợp với <em>cuộc sống</em> của bạn
                        </h1>
                        <p className="enter" style={{ '--i': 2 } as CSSProperties}>
                            Kết nối với những nhà tuyển dụng phù hợp. Khám phá cơ hội theo kỹ năng, địa điểm và mức
                            lương bạn mong muốn.
                        </p>
                        <form
                            className={`${s.heroSearch} enter`}
                            style={{ '--i': 3 } as CSSProperties}
                            onSubmit={search}
                            role="search"
                        >
                            <SearchOutlined className={s.heroSearchIcon} aria-hidden="true" />
                            <label htmlFor="hero-search" className="sr-only">
                                Vị trí bạn muốn tìm
                            </label>
                            <input
                                id="hero-search"
                                value={keyword}
                                onChange={event => setKeyword(event.target.value)}
                                placeholder="Vị trí hoặc chức danh…"
                                maxLength={120}
                            />
                            <span className={s.heroSearchDivider} aria-hidden="true" />
                            <Select
                                className={s.heroSkill}
                                value={skill}
                                onChange={setSkill}
                                allowClear
                                placeholder="Kỹ năng"
                                aria-label="Kỹ năng"
                                options={(skills.data?.result ?? []).map(item => ({
                                    label: item.name,
                                    value: String(item.id),
                                }))}
                                variant="borderless"
                                popupMatchSelectWidth={220}
                                suffixIcon={<DownOutlined />}
                                showSearch
                                optionFilterProp="label"
                            />
                            <button type="submit" className={ui.btnPrimary}>
                                Tìm kiếm <ArrowRightOutlined aria-hidden="true" />
                            </button>
                        </form>
                        {companyList.length > 0 && (
                            <div className={`${s.proof} enter`} style={{ '--i': 4 } as CSSProperties}>
                                <div className={s.proofLogos} aria-hidden="true">
                                    {companyList.slice(0, 4).map(company => (
                                        <CompanyLogo
                                            key={company.id}
                                            name={company.name}
                                            logo={company.logo}
                                            size={36}
                                        />
                                    ))}
                                </div>
                                <p>
                                    <strong>{companies.data?.meta.total} nhà tuyển dụng</strong> đang tìm ứng viên như
                                    bạn
                                </p>
                            </div>
                        )}
                    </div>
                    <div className={s.heroVisual}>
                        <span className={s.heroCircle} aria-hidden="true" />
                        <div className={`${s.heroPerson} enter`} style={{ '--i': 1 } as CSSProperties}>
                            <AssetImage
                                asset={ASSETS.hero}
                                alt="Một người trẻ tự tin bắt đầu hành trình sự nghiệp mới"
                                width="886"
                                height="1080"
                            />
                        </div>
                        {heroJobs[0] && <HeroFloatCard job={heroJobs[0]} className={s.floatTop} />}
                        {heroJobs[1] && (
                            <HeroFloatCard job={heroJobs[1]} className={`${s.floatBottom} ${s.floatGlass}`} />
                        )}
                        <RotatingBadge
                            glass
                            text="Bắt đầu ngay ✦ Bắt đầu ngay ✦ "
                            to={isAuthenticated ? '/job' : '/register'}
                            onClick={isAuthenticated ? undefined : registerClick}
                            label="Bắt đầu tìm việc"
                            className={s.heroBadge}
                        />
                    </div>
                </div>
            </section>

            <div className={s.bands}>
                <Marquee items={(skills.data?.result ?? []).map(skill => skill.name ?? '')} variant={s.bandBack} />
                <Marquee items={companyList.map(company => company.name ?? '')} variant={s.bandFront} />
            </div>

            {/* Employer logos */}
            {companyList.length > 0 && (
                <section className={s.logoStrip} aria-labelledby="logos-title">
                    <p id="logos-title">
                        Được tin chọn bởi <strong>{companies.data?.meta.total} nhà tuyển dụng</strong> trong và ngoài
                        nước
                    </p>
                    <div className={s.logoViewport}>
                        <div className={s.logoTrack}>
                            {[...companyList, ...companyList].map((company, index) => {
                                const copy = index >= companyList.length;
                                return (
                                    <Link
                                        key={`${company.id}-${index}`}
                                        to={companyPath(company)}
                                        className={s.logoItem}
                                        aria-hidden={copy || undefined}
                                        tabIndex={copy ? -1 : undefined}
                                    >
                                        <CompanyLogo name={company.name} logo={company.logo} size={40} />
                                        <span>{company.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Categories */}
            <section className={`${ui.container} ${s.section}`} aria-labelledby="category-title">
                <div className={`${ui.sectionHead} reveal`}>
                    <span className={ui.eyebrow}>Danh mục</span>
                    <h2 id="category-title">Khám phá việc làm theo danh mục</h2>
                    <p>Chọn kỹ năng bạn thế mạnh để xem những vị trí phù hợp nhất.</p>
                </div>
                {/* Wait for counts too: re-sorting a snapped track makes the browser jump to another page. */}
                {skills.loading || jobs.loading ? (
                    <div className={s.skeletonRow} aria-busy="true" aria-label="Đang tải danh mục" />
                ) : skills.error ? (
                    <StatePanel
                        icon={<ReloadOutlined />}
                        title="Chưa tải được danh mục"
                        action={
                            <button className={ui.btnOutline} onClick={skills.retry}>
                                Thử lại
                            </button>
                        }
                    />
                ) : (
                    <Carousel label="Danh mục việc làm" autoPlay={4500} className={`${s.categoryCarousel} reveal`}>
                        {categories.map(category => (
                            <Link key={category.id} to={`/job?skills=${category.id}`} className={s.categoryCard}>
                                <h3>{category.name}</h3>
                                <p>{category.count} việc làm đang tuyển</p>
                                <span className={s.categoryArrow} aria-hidden="true">
                                    <ArrowUpOutlined rotate={45} />
                                </span>
                            </Link>
                        ))}
                    </Carousel>
                )}
            </section>

            <div className={s.wordMarquee} aria-hidden="true">
                {[0, 1].map(row => (
                    <div key={row} className={`${s.wordRow} ${row ? s.wordRowReverse : ''}`}>
                        <div className={s.wordTrack}>
                            {Array.from({ length: 4 }, (_, index) => (
                                <span key={index}>
                                    <b className={row ? s.wordOutline : undefined}>Tìm công việc phù hợp hôm nay</b>
                                    <b className={row ? undefined : s.wordOutline}>Bắt đầu hành trình sự nghiệp</b>
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Featured jobs */}
            <section className={`${ui.container} ${s.section}`} aria-labelledby="featured-title">
                <div className={`${ui.sectionHead} reveal`}>
                    <span className={ui.eyebrow}>Việc làm mới</span>
                    <h2 id="featured-title">Việc làm nổi bật mới nhất</h2>
                    <p>Những vị trí vừa được nhà tuyển dụng đăng tải trên itjobs.</p>
                </div>
                {jobs.loading ? (
                    <div className={s.skeletonRow} aria-busy="true" aria-label="Đang tải việc làm" />
                ) : jobs.error ? (
                    <StatePanel
                        icon={<ReloadOutlined />}
                        title="Chưa tải được việc làm"
                        text="Vui lòng kiểm tra kết nối và thử lại."
                        action={
                            <button className={ui.btnOutline} onClick={jobs.retry}>
                                Thử lại
                            </button>
                        }
                    />
                ) : jobList.length === 0 ? (
                    <StatePanel
                        icon={<SearchOutlined />}
                        title="Cơ hội mới sẽ sớm có mặt"
                        text="Hiện chưa có vị trí đang tuyển. Hãy quay lại sau nhé."
                    />
                ) : (
                    <Coverflow
                        items={jobList.slice(0, 8)}
                        label="Việc làm nổi bật"
                        itemLabel={job => `${job.name} – ${job.company?.name ?? ''}`}
                        className="reveal"
                        render={(job, active) => <JobCard job={job} featured={active} />}
                    />
                )}
                <div className={s.centerAction}>
                    <Link to="/job" className={ui.btnOutline}>
                        Xem thêm việc làm <ArrowRightOutlined />
                    </Link>
                </div>
            </section>

            {/* Metrics */}
            <section ref={metricsRef} className={s.metrics} aria-labelledby="metrics-title">
                <Sparkle className={s.metricsSparkleA} />
                <Sparkle className={s.metricsSparkleB} />
                <h2 id="metrics-title">Những con số biết nói</h2>
                <dl>
                    {stats.map(stat => (
                        <div key={stat.label}>
                            <dt>{stat.label}</dt>
                            <dd aria-label={stat.value === undefined ? undefined : String(stat.value)}>
                                <span aria-hidden="true">
                                    {stat.value === undefined ? (
                                        '—'
                                    ) : metricsVisible ? (
                                        <CountUp
                                            start={0}
                                            end={stat.value}
                                            duration={reduced ? 0 : 2.2}
                                            separator="."
                                        />
                                    ) : (
                                        '0'
                                    )}
                                </span>
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* Features */}
            <section className={`${ui.container} ${s.section}`} aria-labelledby="features-title">
                <div className={`${s.featuresHead} reveal`}>
                    <div>
                        <span className={ui.eyebrow}>Tính năng</span>
                        <h2 id="features-title">Những tính năng giúp bạn tìm việc hiệu quả hơn</h2>
                    </div>
                    <div className={s.strokes} aria-hidden="true">
                        {Array.from({ length: 14 }, (_, index) => (
                            <Sparkle key={index} />
                        ))}
                    </div>
                </div>
                <div className={s.bento}>
                    <article className={`${s.feature} reveal`}>
                        <div className={s.mock} aria-hidden="true">
                            <div className={s.mockJob}>
                                <span className={s.mockLogo}>
                                    <BsCodeSlash />
                                </span>
                                <div>
                                    <strong>Frontend Developer</strong>
                                    <small>Toàn thời gian · Linh hoạt</small>
                                </div>
                                <i className={s.mockBookmark} />
                            </div>
                            <div className={`${s.mockJob} ${s.mockJobBack}`}>
                                <span className={s.mockLogo}>
                                    <BsDatabase />
                                </span>
                                <div>
                                    <strong>Data Engineer</strong>
                                    <small>Toàn thời gian · Tại văn phòng</small>
                                </div>
                                <i className={s.mockBookmark} />
                            </div>
                            <span className={s.mockBar} />
                            <span className={`${s.mockBar} ${s.mockBarShort}`} />
                        </div>
                        <h3>Lưu việc làm yêu thích</h3>
                        <p>Đánh dấu những vị trí bạn quan tâm, so sánh và quay lại ứng tuyển bất cứ lúc nào.</p>
                        <Link to="/job" className={s.featureLink}>
                            Khám phá việc làm <ArrowUpOutlined rotate={45} />
                        </Link>
                    </article>
                    <div className={s.featureStack}>
                        <article
                            className={`${s.feature} ${s.featurePlain} reveal`}
                            style={{ '--i': 1 } as CSSProperties}
                        >
                            <h3>Đánh giá công ty minh bạch</h3>
                            <p>Đọc trải nghiệm thật từ cộng đồng và chia sẻ đánh giá của bạn để giúp người đi sau.</p>
                            <Link to="/company" className={s.featureLink}>
                                Xem đánh giá <ArrowUpOutlined rotate={45} />
                            </Link>
                        </article>
                        <article className={`${s.feature} reveal`} style={{ '--i': 2 } as CSSProperties}>
                            <div className={`${s.mock} ${s.mockReview}`} aria-hidden="true">
                                <div className={s.mockReviewer}>
                                    <img src="/images/nguyen-nam.webp" alt="" width="40" height="40" />
                                    <div>
                                        <strong>Nguyễn Nam</strong>
                                        <small>
                                            <StarFilled />
                                            <StarFilled />
                                            <StarFilled />
                                            <StarFilled />
                                            <StarFilled />
                                        </small>
                                    </div>
                                </div>
                                <div className={s.mockBars}>
                                    {[88, 64, 30].map(width => (
                                        <span key={width}>
                                            <i style={{ width: `${width}%` }} />
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </article>
                    </div>
                    <article className={`${s.feature} reveal`} style={{ '--i': 3 } as CSSProperties}>
                        <div className={s.mock} aria-hidden="true">
                            <div className={s.mockSteps}>
                                <span>1</span>Hồ sơ
                                <i />
                                <span className={s.mockStepActive}>2</span>
                                <b>CV</b>
                            </div>
                            <div className={s.mockFile}>
                                <em>PDF</em>CV_NguyenNam.pdf
                            </div>
                            <div className={`${s.mockFile} ${s.mockFileSub}`}>
                                <em>PDF</em>CV_English.pdf
                            </div>
                            <span className={`${s.mockBar} ${s.mockBarShort}`} />
                        </div>
                        <h3>Ứng tuyển nhanh chóng</h3>
                        <p>
                            Tải CV một lần và gửi hồ sơ trong vài giây. Theo dõi trạng thái ngay trong tài khoản của
                            bạn.
                        </p>
                        <AuthLink mode="register" className={s.featureLink}>
                            Tạo tài khoản <ArrowUpOutlined rotate={45} />
                        </AuthLink>
                    </article>
                </div>
            </section>

            {/* Path to success */}
            <section className={`${ui.container} ${s.section}`} aria-labelledby="path-title">
                <div className={`${ui.sectionHead} reveal`}>
                    <span className={ui.eyebrow}>Quy trình</span>
                    <h2 id="path-title">Hành trình đến công việc mơ ước</h2>
                    <p>
                        Quy trình đơn giản giúp bạn đi từ tạo hồ sơ đến ngày đầu tiên đi làm — itjobs đồng hành ở từng
                        bước.
                    </p>
                </div>
                <div ref={pathRef} className={`${s.path} ${pathVisible ? s.pathStarted : ''}`}>
                    <svg className={s.pathLine} viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true">
                        <defs>
                            <mask
                                id="career-road-reveal"
                                maskUnits="userSpaceOnUse"
                                x="-32"
                                y="0"
                                width="1264"
                                height="300"
                            >
                                <path className={s.roadReveal} d={careerRoad} pathLength={1} />
                            </mask>
                        </defs>
                        <path className={s.roadSurface} d={careerRoad} />
                        <path className={s.roadMarkings} d={careerRoad} mask="url(#career-road-reveal)" />
                        {pathVisible && !reduced && (
                            <g className={s.pathPlane}>
                                <image
                                    href="/favicon.svg"
                                    x="-18"
                                    y="-18"
                                    width="36"
                                    height="36"
                                    transform="rotate(90)"
                                />
                                <animateMotion
                                    ref={startCareerFlight}
                                    begin="indefinite"
                                    path={careerRoad}
                                    dur="5s"
                                    rotate="auto"
                                    fill="freeze"
                                />
                            </g>
                        )}
                    </svg>
                    <ol>
                        {steps.map((step, index) => (
                            <li
                                key={step.title}
                                className={index % 2 ? s.stepLow : s.stepHigh}
                                style={{ '--i': index } as CSSProperties}
                            >
                                <span className={s.stepNumber}>{index + 1}</span>
                                <Link
                                    to={step.to}
                                    className={s.stepBody}
                                    onClick={step.to === '/register' ? registerClick : undefined}
                                >
                                    <span className={s.stepIcon} aria-hidden="true">
                                        {step.icon}
                                    </span>
                                    <strong>{step.title}</strong>
                                </Link>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* Testimonials */}
            <section
                ref={testimonialsRef}
                className={`${s.testimonials} ${testimonialsIn ? s.testimonialsIn : ''}`}
                aria-labelledby="testimonials-title"
            >
                <div className={ui.container}>
                    <div className={`${ui.sectionHead} reveal`}>
                        <span className={ui.eyebrow}>Cảm nhận</span>
                        <h2 id="testimonials-title">Cảm nhận từ ứng viên &amp; nhà tuyển dụng</h2>
                    </div>
                    <div className={s.testimonialGrid}>
                        {testimonials.map((item, index) => (
                            <figure key={item.name} className={s.testimonial} style={{ '--i': index } as CSSProperties}>
                                <span className={s.testimonialTag}>{item.tag}</span>
                                <blockquote>
                                    <p>“{item.quote}”</p>
                                </blockquote>
                                <figcaption>
                                    <span
                                        role="img"
                                        aria-label={`Ảnh của ${item.name}`}
                                        className={s.testimonialAvatar}
                                        style={{
                                            backgroundImage: `url(${item.photo})`,
                                            backgroundSize: item.zoom,
                                            backgroundPosition: item.focus,
                                        }}
                                    />
                                    <strong>{item.name}</strong>
                                    <span>{item.role}</span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
                <AssetImage
                    asset={ASSETS.testimonialCandidate}
                    className={`${s.testimonialArt} ${s.testimonialArtLeft}`}
                    loading="lazy"
                />
                <AssetImage
                    asset={ASSETS.testimonialEmployer}
                    className={`${s.testimonialArt} ${s.testimonialArtRight}`}
                    loading="lazy"
                />
            </section>

            {/* Career guide */}
            <section className={s.guide} id="career-guide" aria-labelledby="guide-title">
                <div className={ui.container}>
                    <div className={`${ui.sectionHead} reveal`}>
                        <span className={ui.eyebrow}>Cẩm nang</span>
                        <h2 id="guide-title">Cẩm nang nghề nghiệp</h2>
                        <p>Những lời khuyên thiết thực từ đội ngũ itjobs cho từng chặng tìm việc.</p>
                    </div>
                    <div className={`${s.guideGrid} reveal`}>
                        <div
                            className={s.guideTabs}
                            role="tablist"
                            aria-label="Chủ đề cẩm nang"
                            aria-orientation="vertical"
                        >
                            {guides.map((item, index) => (
                                <button
                                    key={item.title}
                                    type="button"
                                    role="tab"
                                    id={`guide-tab-${index}`}
                                    aria-controls="guide-panel"
                                    aria-selected={guide === index}
                                    tabIndex={guide === index ? 0 : -1}
                                    onClick={() => setGuide(index)}
                                    onKeyDown={event => {
                                        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                                            event.preventDefault();
                                            const next =
                                                (index + (event.key === 'ArrowDown' ? 1 : guides.length - 1)) %
                                                guides.length;
                                            setGuide(next);
                                            document.getElementById(`guide-tab-${next}`)?.focus();
                                        }
                                    }}
                                >
                                    <BsQuote className={s.guideQuote} aria-hidden="true" />
                                    <span>
                                        <strong>{item.title}</strong>
                                        <span>{item.short}</span>
                                    </span>
                                    <span className={s.guideIndex}>0{index + 1}</span>
                                </button>
                            ))}
                        </div>
                        <article
                            key={guide}
                            className={s.guidePanel}
                            role="tabpanel"
                            id="guide-panel"
                            aria-labelledby={`guide-tab-${guide}`}
                        >
                            <BsQuote className={s.guidePanelQuote} aria-hidden="true" />
                            <h3>{guides[guide].title}</h3>
                            <p>{guides[guide].body}</p>
                            <footer>
                                <img src="/favicon.svg" alt="" width="40" height="40" />
                                <div>
                                    <strong>Đội ngũ itjobs</strong>
                                    <span>Cẩm nang nghề nghiệp</span>
                                </div>
                            </footer>
                        </article>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className={`${ui.container} ${s.section} ${s.faq}`} id="faq" aria-labelledby="faq-title">
                <div className={`${s.faqIntro} reveal`}>
                    <span className={ui.eyebrow}>Hỏi đáp</span>
                    <h2 id="faq-title">Câu hỏi thường gặp</h2>
                    <p>Những thắc mắc phổ biến khi tìm việc và ứng tuyển trên itjobs.</p>
                    <div className={s.faqBlob} aria-hidden="true">
                        <AssetImage asset={ASSETS.blob} />
                    </div>
                    <div className={s.faqCard}>
                        <h3>Sẵn sàng bắt đầu?</h3>
                        <p>
                            {isAuthenticated
                                ? 'Theo dõi hồ sơ đã gửi và việc làm đã lưu của bạn.'
                                : 'Tạo tài khoản miễn phí để ứng tuyển và lưu việc làm yêu thích.'}
                        </p>
                        {isAuthenticated ? (
                            <button
                                type="button"
                                className={ui.btnPrimarySm}
                                onClick={() => openAccount('user-resume')}
                            >
                                Xem hồ sơ của tôi
                            </button>
                        ) : (
                            <AuthLink mode="register" className={ui.btnPrimarySm}>
                                Tạo tài khoản
                            </AuthLink>
                        )}
                    </div>
                </div>
                <div className={s.faqList}>
                    {faqs.map((item, index) => (
                        <details
                            key={item.q}
                            className={`${s.faqItem} reveal`}
                            style={{ '--i': index } as CSSProperties}
                            open={index === 0}
                        >
                            <summary>
                                {item.q}
                                <span className={s.faqIcon} aria-hidden="true">
                                    <PlusOutlined />
                                </span>
                            </summary>
                            <p>{item.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            {/* Featured articles */}
            <section
                className={`${ui.container} ${s.section} ${s.articles}`}
                id="featured-articles"
                aria-labelledby="articles-title"
            >
                <Carousel
                    label="Bài viết nổi bật về thị trường IT"
                    className={`${s.articleCarousel} reveal`}
                    intro={
                        <div className={s.articlesIntro}>
                            <span className={ui.eyebrow}>Góc nhìn IT</span>
                            <h2 id="articles-title">Bài viết đáng đọc cho sự nghiệp IT</h2>
                            <p>
                                {featuredArticles.length} bài tuyển chọn về thị trường việc làm, công nghệ và phát triển
                                sự nghiệp.
                            </p>
                        </div>
                    }
                >
                    {featuredArticles.map(article => (
                        <article
                            key={article.href}
                            className={s.articleCard}
                            style={{ '--article-cover': `url("${article.image}")` } as CSSProperties}
                        >
                            <AssetImage
                                asset={{ src: article.image, fallback: '/images/career-workspace.webp' }}
                                className={s.articlePhoto}
                                loading="lazy"
                            />
                            <div className={s.articleBody}>
                                <span className={s.articleCategory}>{article.category}</span>
                                <h3>
                                    <a
                                        className={ui.stretchedLink}
                                        href={article.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`${article.title} (mở tab mới)`}
                                    >
                                        {article.title}
                                    </a>
                                </h3>
                                <p>{article.summary}</p>
                                <span className={s.articleSource}>
                                    {article.source} · {article.period}
                                </span>
                                <span className={s.articleCta} aria-hidden="true">
                                    Đọc bài viết <ArrowUpOutlined rotate={45} />
                                </span>
                            </div>
                        </article>
                    ))}
                </Carousel>
            </section>

            {/* Newsletter */}
            <section className={s.newsletterWrap} id="newsletter" aria-labelledby="newsletter-title">
                <AssetImage asset={ASSETS.newsletterLeft} className={s.newsIllustrationLeft} loading="lazy" />
                <AssetImage asset={ASSETS.newsletterRight} className={s.newsIllustrationRight} loading="lazy" />
                <div className={`${ui.container} ${s.newsletter} reveal`}>
                    <div className={s.newsletterPhoto}>
                        <AssetImage asset={ASSETS.newsletter} loading="lazy" />
                    </div>
                    <div className={s.newsletterBody}>
                        <span className={s.newsletterEyebrow}>
                            <MailOutlined /> Bản tin việc làm
                        </span>
                        <h2 id="newsletter-title">Không bỏ lỡ công việc phù hợp</h2>
                        <p>Chọn kỹ năng bạn quan tâm để nhận thông tin về những vị trí mới phù hợp với bạn.</p>
                        {isAuthenticated ? <JobByEmail compact /> : <NewsletterGuest />}
                    </div>
                </div>
            </section>
        </>
    );
};

const NewsletterGuest = () => {
    const openAuth = useAuthModal();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    return (
        <form
            className={s.newsletterForm}
            onSubmit={event => {
                event.preventDefault();
                openAuth('register', { name: name.trim(), email: email.trim() });
            }}
        >
            <label htmlFor="news-name" className="sr-only">
                Họ và tên
            </label>
            <input
                id="news-name"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Họ và tên"
                autoComplete="name"
                required
            />
            <label htmlFor="news-email" className="sr-only">
                Email
            </label>
            <input
                id="news-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="Email của bạn"
                autoComplete="email"
                required
            />
            <button type="submit" className={ui.btnPrimary}>
                Đăng ký nhận tin
            </button>
            <small>Bạn sẽ tạo tài khoản miễn phí để chọn kỹ năng nhận tin.</small>
        </form>
    );
};

export default HomePage;
