import { useEffect, useState } from 'react';
import { CloudUploadOutlined, DeleteOutlined, FileTextOutlined, LinkOutlined } from '@ant-design/icons';
import { Alert, Input, Modal, Progress, Segmented, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { Link } from 'react-router-dom';
import { callCheckApplied, callCreateResume, callFetchMyProfile, callUploadSingleFile } from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import { isCloudLink, CV_ACCEPT, CV_HINT, isCvFile } from '@/config/utils';
import { IJob } from '@/types/backend';
import { useAccountModal } from './manage.account';
import { errorText, useAuthModal } from '../auth';
import CompanyLogo from '../card/company-logo';
import CvViewerModal from '../cv-viewer';
import Confetti from '../confetti';
import ui from '@/styles/client.module.scss';
import d from '@/styles/detail.module.scss';

interface IProps {
    isModalOpen: boolean;
    setIsModalOpen: (value: boolean) => void;
    jobDetail: IJob | null;
    onApplied?: () => void;
}

interface PickedFile {
    name: string;
    size: number;
    percent: number;
    status: 'uploading' | 'done' | 'error';
}

const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const ApplyModal = ({ isModalOpen, setIsModalOpen, jobDetail, onApplied }: IProps) => {
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const user = useAppSelector(state => state.account.user);
    const openAccount = useAccountModal();
    const openAuth = useAuthModal();
    const [urlCV, setUrlCV] = useState('');
    const [savedCv, setSavedCv] = useState<{ url: string; name: string } | null>(null);
    const [useSaved, setUseSaved] = useState(false);
    const [viewing, setViewing] = useState(false);
    const [file, setFile] = useState<PickedFile | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [alreadyApplied, setAlreadyApplied] = useState(false);
    const [mode, setMode] = useState<'file' | 'link'>('file');
    const [link, setLink] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [error, setError] = useState('');
    const uploading = file?.status === 'uploading';
    const busy = uploading || isSubmitting;

    useEffect(() => {
        if (isModalOpen) {
            setUrlCV('');
            setFile(null);
            setError('');
            setDone(false);
            setAlreadyApplied(false);
            setSavedCv(null);
            setUseSaved(false);
            setMode('file');
            setLink('');
            setCoverLetter('');
        }
    }, [isModalOpen, jobDetail?.id]);

    useEffect(() => {
        if (!isModalOpen || !isAuthenticated || !jobDetail?.id) return;
        let ignore = false;
        (async () => {
            try {
                const res = await callCheckApplied(jobDetail.id!);
                if (ignore || !res?.data?.applied) return;
                setAlreadyApplied(true);
                onApplied?.();
            } catch {}
        })();
        return () => {
            ignore = true;
        };
    }, [isModalOpen, isAuthenticated, jobDetail?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!isModalOpen || !isAuthenticated) return;
        let ignore = false;
        (async () => {
            try {
                const res = await callFetchMyProfile();
                if (ignore || !res.data?.cvUrl) return;
                setSavedCv({ url: res.data.cvUrl, name: res.data.cvName || res.data.cvUrl });
                setUseSaved(true);
                setUrlCV(res.data.cvUrl);
            } catch {}
        })();
        return () => {
            ignore = true;
        };
    }, [isModalOpen, isAuthenticated, jobDetail?.id]);

    const close = () => {
        if (!busy) setIsModalOpen(false);
    };

    const submit = async () => {
        if (!isAuthenticated) {
            setIsModalOpen(false);
            openAuth('login');
            return;
        }
        if (busy || !jobDetail?.id) return;
        if (!urlCV) {
            setError(
                mode === 'link'
                    ? 'Vui lòng dán liên kết CV hợp lệ (Google Drive, Dropbox hoặc OneDrive).'
                    : 'Vui lòng tải CV lên trước khi gửi hồ sơ.',
            );
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            const res = await callCreateResume(urlCV, jobDetail.id, user.email, user.id, coverLetter);
            if (res.data) {
                setDone(true);
                onApplied?.();
            } else if (+res.statusCode === 409) {
                setAlreadyApplied(true);
                onApplied?.();
            } else setError(errorText(res, 'Chưa thể gửi hồ sơ. Vui lòng thử lại.'));
        } catch {
            setError('Không thể kết nối. CV đã tải lên vẫn được giữ, bạn có thể gửi lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const uploadProps: UploadProps = {
        accept: CV_ACCEPT,
        multiple: false,
        showUploadList: false,
        disabled: busy,
        beforeUpload(picked) {
            if (!isCvFile(picked.name)) {
                setError(`CV cần là ${CV_HINT}.`);
                return Upload.LIST_IGNORE;
            }
            if (picked.size > 5 * 1024 * 1024) {
                setError('CV cần có dung lượng tối đa 5 MB.');
                return Upload.LIST_IGNORE;
            }
            setError('');
            setUrlCV('');
            setFile({ name: picked.name, size: picked.size, percent: 0, status: 'uploading' });
            return true;
        },
        async customRequest({ file: picked, onSuccess, onError }) {
            try {
                const res = await callUploadSingleFile(picked, 'resume', percent =>
                    setFile(current => current && { ...current, percent }),
                );
                if (!res.data?.fileName) throw new Error(res.message || 'Không thể tải CV lên. Vui lòng thử lại.');
                setUrlCV(res.data.fileName);
                setFile(current => current && { ...current, percent: 100, status: 'done' });
                onSuccess?.(res.data);
            } catch (uploadError) {
                const text =
                    uploadError instanceof Error ? uploadError.message : 'Không thể tải CV lên. Vui lòng thử lại.';
                setFile(current => current && { ...current, status: 'error' });
                setError(text);
                onError?.(new Error(text));
            }
        },
    };

    return (
        <>
            <Modal
                open={isModalOpen}
                onCancel={close}
                closable={!busy}
                maskClosable={!busy}
                keyboard={!busy}
                footer={null}
                destroyOnClose
                centered
                width={500}
                className={d.applyModal}
                title={done || alreadyApplied ? null : 'Tải CV của bạn lên'}
            >
                {alreadyApplied && !done ? (
                    <div className={d.applyDone} role="status">
                        <span className={d.applyDoneIcon}>
                            <svg viewBox="0 0 52 52" aria-hidden="true">
                                <path d="M15 27l8 8 15-17" />
                            </svg>
                        </span>
                        <h2>Bạn đã ứng tuyển vị trí này</h2>
                        <p>
                            Hồ sơ của bạn cho vị trí <strong>{jobDetail?.name}</strong> tại{' '}
                            <strong>{jobDetail?.company?.name || 'nhà tuyển dụng'}</strong> đã được gửi. Mỗi tin tuyển
                            dụng chỉ nhận một hồ sơ từ mỗi ứng viên; bạn có thể theo dõi trạng thái bất cứ lúc nào.
                        </p>
                        <div className={d.applyDoneActions}>
                            <button
                                type="button"
                                className={ui.btnOutline}
                                onClick={() => {
                                    setIsModalOpen(false);
                                    openAccount('user-resume');
                                }}
                            >
                                Theo dõi hồ sơ
                            </button>
                            <button type="button" className={ui.btnPrimary} onClick={() => setIsModalOpen(false)}>
                                Đóng
                            </button>
                        </div>
                    </div>
                ) : done ? (
                    <div className={d.applyDone} role="status">
                        <Confetti />
                        <span className={d.applyDoneIcon}>
                            <svg viewBox="0 0 52 52" aria-hidden="true">
                                <path d="M15 27l8 8 15-17" />
                            </svg>
                        </span>
                        <h2>Nộp hồ sơ thành công!</h2>
                        <p>
                            CV của bạn đã được gửi tới <strong>{jobDetail?.company?.name || 'nhà tuyển dụng'}</strong>{' '}
                            cho vị trí <strong>{jobDetail?.name}</strong>. Bạn có thể theo dõi trạng thái hồ sơ bất cứ
                            lúc nào.
                        </p>
                        <div className={d.applyDoneActions}>
                            <button
                                type="button"
                                className={ui.btnOutline}
                                onClick={() => {
                                    setIsModalOpen(false);
                                    openAccount('user-resume');
                                }}
                            >
                                Theo dõi hồ sơ
                            </button>
                            <button type="button" className={ui.btnPrimary} onClick={() => setIsModalOpen(false)}>
                                Xong
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={d.applyJob}>
                            <CompanyLogo name={jobDetail?.company?.name} logo={jobDetail?.company?.logo} size={44} />
                            <div>
                                <strong>{jobDetail?.name}</strong>
                                <span>{jobDetail?.company?.name}</span>
                            </div>
                        </div>
                        {isAuthenticated ? (
                            <>
                                {savedCv && useSaved && (
                                    <div className={d.savedCv}>
                                        <FileTextOutlined className={d.fileIcon} aria-hidden="true" />
                                        <div>
                                            <strong>CV trong hồ sơ của bạn</strong>
                                            <span>{savedCv.name}</span>
                                        </div>
                                        <button type="button" className={d.linkButton} onClick={() => setViewing(true)}>
                                            Xem
                                        </button>
                                        <button
                                            type="button"
                                            className={d.linkButton}
                                            disabled={isSubmitting}
                                            onClick={() => {
                                                setUseSaved(false);
                                                setUrlCV('');
                                                setError('');
                                            }}
                                        >
                                            Dùng CV khác
                                        </button>
                                    </div>
                                )}
                                {savedCv && !useSaved && !busy && (
                                    <button
                                        type="button"
                                        className={d.linkButton}
                                        onClick={() => {
                                            setUseSaved(true);
                                            setUrlCV(savedCv.url);
                                            setFile(null);
                                            setError('');
                                        }}
                                    >
                                        Dùng CV trong hồ sơ ({savedCv.name})
                                    </button>
                                )}
                                {!(savedCv && useSaved) && !busy && (
                                    <Segmented
                                        block
                                        className={d.cvMode}
                                        value={mode}
                                        options={[
                                            { label: 'Tải tệp CV', value: 'file' },
                                            { label: 'Dán liên kết', value: 'link' },
                                        ]}
                                        onChange={value => {
                                            setMode(value as 'file' | 'link');
                                            setUrlCV(value === 'link' && isCloudLink(link) ? link.trim() : '');
                                            setFile(null);
                                            setError('');
                                        }}
                                    />
                                )}
                                {!(savedCv && useSaved) && mode === 'file' && (
                                    <Upload.Dragger {...uploadProps} className={d.dropzone}>
                                        <span className={d.dropIcon}>
                                            <CloudUploadOutlined />
                                        </span>
                                        <p className={d.dropTitle}>Kéo thả hoặc chọn tệp để tải lên</p>
                                        <p className={d.dropHint}>{CV_HINT} · Tối đa 5 MB</p>
                                    </Upload.Dragger>
                                )}
                                {!(savedCv && useSaved) && mode === 'link' && (
                                    <div className={d.linkField}>
                                        <Input
                                            prefix={<LinkOutlined />}
                                            value={link}
                                            disabled={isSubmitting}
                                            placeholder="https://drive.google.com/file/d/…"
                                            maxLength={255}
                                            status={link && !isCloudLink(link) ? 'error' : undefined}
                                            aria-label="Liên kết CV"
                                            onChange={event => {
                                                setLink(event.target.value);
                                                setUrlCV(
                                                    isCloudLink(event.target.value) ? event.target.value.trim() : '',
                                                );
                                                setError('');
                                            }}
                                        />
                                        <small className={link && !isCloudLink(link) ? d.linkError : undefined}>
                                            {link && !isCloudLink(link)
                                                ? 'Chỉ hỗ trợ liên kết https của Google Drive, Dropbox hoặc OneDrive.'
                                                : 'Hỗ trợ Google Drive, Dropbox, OneDrive. Đặt quyền “Bất kỳ ai có liên kết đều xem được” để nhà tuyển dụng mở được.'}
                                        </small>
                                    </div>
                                )}
                                {file && (
                                    <div className={d.fileRow}>
                                        <FileTextOutlined className={d.fileIcon} aria-hidden="true" />
                                        <div className={d.fileInfo}>
                                            <div>
                                                <strong>{file.name}</strong>
                                                {!busy && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFile(null);
                                                            setUrlCV('');
                                                            setError('');
                                                        }}
                                                        aria-label={`Bỏ tệp ${file.name}`}
                                                    >
                                                        <DeleteOutlined />
                                                    </button>
                                                )}
                                            </div>
                                            <span>
                                                {formatSize(file.size)} ·{' '}
                                                {file.status === 'uploading'
                                                    ? `Đang tải lên ${file.percent}%`
                                                    : file.status === 'done'
                                                      ? 'Tải lên hoàn tất'
                                                      : 'Tải lên thất bại'}
                                            </span>
                                            <Progress
                                                percent={file.percent}
                                                showInfo={false}
                                                size="small"
                                                status={
                                                    file.status === 'error'
                                                        ? 'exception'
                                                        : file.status === 'done'
                                                          ? 'success'
                                                          : 'active'
                                                }
                                                strokeColor="#E3763C"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className={d.coverLetter}>
                                    <label htmlFor="cover-letter">
                                        Thư xin việc <small>(không bắt buộc)</small>
                                    </label>
                                    <Input.TextArea
                                        id="cover-letter"
                                        rows={3}
                                        maxLength={3000}
                                        showCount
                                        value={coverLetter}
                                        disabled={isSubmitting}
                                        onChange={event => setCoverLetter(event.target.value)}
                                        placeholder="Giới thiệu ngắn về bạn và lý do bạn phù hợp với vị trí này…"
                                    />
                                </div>
                                <p className={d.applyNote}>
                                    CV và email <strong>{user.email}</strong> sẽ được gửi tới nhà tuyển dụng khi bạn
                                    chọn gửi hồ sơ.
                                </p>
                            </>
                        ) : (
                            <div className={d.applyGuest}>
                                <h3>Đăng nhập để ứng tuyển</h3>
                                <p>Bạn sẽ quay lại trang việc làm này ngay sau khi đăng nhập.</p>
                            </div>
                        )}
                        {error && <Alert type="error" showIcon message={error} className={d.applyError} />}
                        <div className={d.applyFooter}>
                            <Link to="/#faq" onClick={() => setIsModalOpen(false)}>
                                Cần hỗ trợ?
                            </Link>
                            <div>
                                <button type="button" className={ui.btnOutline} onClick={close} disabled={busy}>
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    className={ui.btnPrimary}
                                    onClick={submit}
                                    disabled={uploading || (isAuthenticated && !urlCV) || isSubmitting}
                                >
                                    {isSubmitting ? 'Đang gửi…' : isAuthenticated ? 'Gửi hồ sơ' : 'Đăng nhập'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </Modal>
            <CvViewerModal
                open={viewing}
                endpoint="/api/v1/me/profile/cv"
                file={savedCv?.url}
                name={savedCv?.name}
                onClose={() => setViewing(false)}
            />
        </>
    );
};

export default ApplyModal;
