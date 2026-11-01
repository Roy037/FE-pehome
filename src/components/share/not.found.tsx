import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <>
            <Result
                status="404"
                title="404"
                subTitle="Trang này không còn tồn tại. Khám phá cơ hội mới trên itjobs."
                extra={
                    <Button type="primary" onClick={() => navigate('/')}>
                        Về trang chủ
                    </Button>
                }
            />
        </>
    );
};

export default NotFound;
