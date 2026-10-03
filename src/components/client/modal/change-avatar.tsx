import { useState } from 'react';
import { Avatar, Button, Modal, Upload, message } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { callSaveMyAvatar, callUploadSingleFile } from '@/config/api';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchAccount } from '@/redux/slice/accountSlide';
import { avatarUrl } from '../avatar';
import { errorText } from '../auth';

// For accounts with no candidate profile page (employers, admins): change or remove the profile picture.
const ChangeAvatarModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.account.user);
    const [busy, setBusy] = useState(false);

    const save = async (fileName: string) => {
        const res = await callSaveMyAvatar(fileName);
        if (+(res?.statusCode ?? 0) !== 200) throw new Error(errorText(res, 'Chưa lưu được ảnh. Vui lòng thử lại.'));
        await dispatch(fetchAccount());
        message.success(fileName ? 'Đã đổi ảnh đại diện.' : 'Đã xóa ảnh đại diện.');
    };

    const run = async (task: () => Promise<void>) => {
        setBusy(true);
        try {
            await task();
        } catch (error) {
            message.error((error instanceof Error && error.message) || 'Chưa thực hiện được. Vui lòng thử lại.');
        } finally {
            setBusy(false);
        }
    };

    const upload = (file: File) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            message.error('Ảnh đại diện chỉ nhận JPG, PNG hoặc WEBP.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            message.error('Ảnh đại diện tối đa 2MB.');
            return;
        }
        run(async () => {
            const res = await callUploadSingleFile(file, 'avatar');
            if (!res.data?.fileName) throw new Error('Chưa tải được ảnh. Vui lòng thử lại.');
            await save(res.data.fileName);
        });
    };

    return (
        <Modal title="Ảnh đại diện" open={open} onCancel={onClose} footer={null} centered width={340} destroyOnClose>
            <div style={{ display: 'grid', justifyItems: 'center', gap: 14, padding: '8px 0 4px' }}>
                <Avatar
                    size={104}
                    src={user.avatar ? avatarUrl(user.avatar) : undefined}
                    style={{
                        background: 'var(--brand-soft)',
                        color: 'var(--brand-text)',
                        fontSize: 38,
                        fontWeight: 600,
                    }}
                >
                    {user.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Upload
                        accept=".jpg,.jpeg,.png,.webp"
                        showUploadList={false}
                        disabled={busy}
                        beforeUpload={file => {
                            upload(file);
                            return Upload.LIST_IGNORE;
                        }}
                    >
                        <Button type="primary" icon={<UploadOutlined />} loading={busy}>
                            Chọn ảnh
                        </Button>
                    </Upload>
                    {user.avatar && (
                        <Button danger icon={<DeleteOutlined />} disabled={busy} onClick={() => run(() => save(''))}>
                            Xóa ảnh
                        </Button>
                    )}
                </div>
                <small style={{ color: 'var(--muted)' }}>JPG, PNG hoặc WEBP, tối đa 2MB.</small>
            </div>
        </Modal>
    );
};

export default ChangeAvatarModal;
