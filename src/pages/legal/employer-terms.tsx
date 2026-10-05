import { Link } from 'react-router-dom';
import { EmployerTermsContent } from '@/components/client/employer-terms';
import ui from '@/styles/client.module.scss';
import s from '@/styles/legal.module.scss';

const EmployerTermsPage = () => (
    <div className={`${ui.container} ${s.page}`}>
        <nav className={s.crumb} aria-label="Đường dẫn">
            <Link to="/">Trang chủ</Link>
            <span>/</span>
            <span aria-current="page">Điều khoản nhà tuyển dụng</span>
        </nav>
        <h1>Điều khoản sử dụng dành cho nhà tuyển dụng</h1>
        <EmployerTermsContent />
    </div>
);

export default EmployerTermsPage;
