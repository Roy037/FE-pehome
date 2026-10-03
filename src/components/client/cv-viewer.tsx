import { useEffect, useState } from 'react';
import { Button, Modal, Skeleton } from 'antd';
import { DownloadOutlined, ExportOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons';
import { callFetchDocument } from '@/config/api';
import s from '@/styles/cv-viewer.module.scss';

interface IProps {
    open: boolean;
    endpoint?: string | null;
    file?: string | null;
    name?: string | null;
    onClose: () => void;
}

type ViewState = { status: 'loading' } | { status: 'ready' | 'unsupported'; url: string } | { status: 'error' };

const CvViewerModal = ({ open, endpoint, file, name, onClose }: IProps) => {
    const [state, setState] = useState<ViewState>({ status: 'loading' });
    const [attempt, setAttempt] = useState(0);
    const label = name?.replace(/^\d+-/, '') || file?.replace(/^\d+-/, '') || 'CV';

    useEffect(() => {
        if (!open || !endpoint) return;
        let cancelled = false;
        let objectUrl = '';
        setState({ status: 'loading' });
        (async () => {
            try {
                const data = await callFetchDocument(endpoint);
                if (!(data instanceof Blob) || data.type.includes('json')) throw new Error();
                const isPdf = data.type === 'application/pdf' || /\.pdf$/i.test(file ?? '');
                objectUrl = URL.createObjectURL(isPdf ? new Blob([data], { type: 'application/pdf' }) : data);
                if (!cancelled) setState({ status: isPdf ? 'ready' : 'unsupported', url: objectUrl });
            } catch {
                if (!cancelled) setState({ status: 'error' });
            }
        })();
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [open, endpoint, file, attempt]);

    const ready = state.status === 'ready' ? state.url : '';

    return (
        <Modal
            open={open}
            onCancel={onClose}
            centered
            destroyOnClose
            width="min(980px, calc(100vw - 24px))"
            className={s.viewer}
            title={label}
            footer={
                <div className={s.footer}>
                    <button
                        type="button"
                        className={s.link}
                        disabled={!ready}
                        onClick={() => window.open(ready, '_blank', 'noopener')}
                    >
                        <ExportOutlined /> Mở trong tab mới
                    </button>
                    <Button type="primary" onClick={onClose}>
                        Đóng
                    </Button>
                </div>
            }
        >
            {state.status === 'loading' && (
                <div className={s.frame}>
                    <Skeleton active paragraph={{ rows: 12 }} />
                </div>
            )}
            {state.status === 'ready' && (
                <iframe className={s.frame} src={`${state.url}#toolbar=1&navpanes=0`} title={`Xem trước CV ${label}`} />
            )}
            {state.status === 'unsupported' && (
                <div className={`${s.frame} ${s.notice}`}>
                    <FileTextOutlined aria-hidden="true" />
                    <strong>Định dạng này chưa hỗ trợ xem trước</strong>
                    <p>Hãy tải tệp về để xem CV (chỉ tệp PDF mới xem được ngay trên trang).</p>
                    <a className={s.download} href={state.url} download={label}>
                        <DownloadOutlined /> Tải CV về
                    </a>
                </div>
            )}
            {state.status === 'error' && (
                <div className={`${s.frame} ${s.notice}`}>
                    <FileTextOutlined aria-hidden="true" />
                    <strong>Chưa tải được CV</strong>
                    <p>Tệp có thể đã bị xoá, bạn không có quyền xem hoặc kết nối đang gián đoạn.</p>
                    <Button icon={<ReloadOutlined />} onClick={() => setAttempt(value => value + 1)}>
                        Thử lại
                    </Button>
                </div>
            )}
        </Modal>
    );
};

export default CvViewerModal;
