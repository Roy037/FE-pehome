import { Modal } from 'antd';
import s from '@/styles/legal.module.scss';

export const TERMS_VERSION_LABEL = '2026-10';

const SECTIONS: { title: string; items: string[] }[] = [
    {
        title: '1. Phạm vi',
        items: [
            'Điều khoản này áp dụng cho mọi tài khoản nhà tuyển dụng trên itjobs, gồm người đại diện đăng ký và những người được công ty cho phép dùng tài khoản.',
            'Khi bấm "Tôi đồng ý" hoặc tiếp tục sử dụng tài khoản, bạn xác nhận mình có quyền hành động thay mặt công ty và chấp nhận toàn bộ điều khoản dưới đây.',
        ],
    },
    {
        title: '2. Tài khoản và xác minh nhà tuyển dụng',
        items: [
            'Thông tin công ty và người liên hệ phải chính xác, đầy đủ và được cập nhật khi có thay đổi (tên công ty, mã số thuế, địa chỉ, số điện thoại, website).',
            'itjobs có thể yêu cầu bổ sung giấy tờ chứng minh tư cách pháp lý của công ty. Tài khoản chỉ được đăng tin sau khi công ty được duyệt.',
            'itjobs có quyền từ chối, tạm ngừng hoặc khóa tài khoản và tin tuyển dụng khi thông tin không xác minh được hoặc có dấu hiệu giả mạo.',
            'Bạn chịu trách nhiệm giữ bí mật mật khẩu và mọi hoạt động diễn ra dưới tài khoản của mình.',
        ],
    },
    {
        title: '3. Nội dung tin tuyển dụng',
        items: [
            'Tin đăng phải trung thực về vị trí, mức lương, địa điểm, quyền lợi và yêu cầu; không dùng thông tin gây hiểu nhầm.',
            'Không đăng tin phân biệt đối xử, vi phạm pháp luật, hoặc có dấu hiệu lừa đảo, đa cấp, cờ bạc.',
            'Không thu phí của ứng viên dưới bất kỳ hình thức nào (phí ứng tuyển, đặt cọc, mua khóa học hay vật dụng) để nhận việc.',
            'Không gửi thư rác hoặc quảng cáo không liên quan tới tuyển dụng cho ứng viên.',
        ],
    },
    {
        title: '4. Dữ liệu của ứng viên',
        items: [
            'Hồ sơ, CV, email và số điện thoại của ứng viên chỉ được dùng cho mục đích tuyển dụng đúng vị trí mà ứng viên đã ứng tuyển hoặc đã chia sẻ hồ sơ công khai trên kho ứng viên.',
            'Không bán, chia sẻ cho bên thứ ba, hoặc dùng dữ liệu ứng viên cho mục đích khác khi chưa có sự đồng ý của họ.',
            'Bạn phải bảo mật dữ liệu, xóa khi không còn cần thiết và tuân thủ quy định pháp luật Việt Nam về bảo vệ dữ liệu cá nhân.',
        ],
    },
    {
        title: '5. Dịch vụ trả phí',
        items: [
            'Một số dịch vụ có thể thu phí, ví dụ ghim tin lên đầu danh sách, mua thêm số tin đang mở, mở khóa kho ứng viên. Giá, thời hạn và phạm vi từng dịch vụ được hiển thị trước khi thanh toán.',
            'Dịch vụ có hiệu lực ngay khi thanh toán thành công. Phí đã thanh toán không được hoàn lại, trừ trường hợp lỗi hệ thống khiến dịch vụ không được cung cấp.',
        ],
    },
    {
        title: '6. Kiểm duyệt và xử lý vi phạm',
        items: [
            'Người dùng có thể báo cáo tin tuyển dụng. itjobs có quyền gỡ, khóa tin hoặc tài khoản vi phạm và sẽ thông báo lý do cho nhà tuyển dụng.',
            'Nhà tuyển dụng có thể giải trình và chỉnh sửa để được xem xét lại.',
        ],
    },
    {
        title: '7. Giới hạn trách nhiệm',
        items: [
            'itjobs là nền tảng kết nối, không tham gia vào quan hệ lao động giữa nhà tuyển dụng và ứng viên, và không đảm bảo kết quả tuyển dụng.',
            'itjobs không chịu trách nhiệm với thiệt hại phát sinh từ thông tin do nhà tuyển dụng hoặc ứng viên cung cấp, hoặc từ sự cố ngoài tầm kiểm soát hợp lý.',
        ],
    },
    {
        title: '8. Thay đổi điều khoản',
        items: [
            'itjobs có thể cập nhật điều khoản này. Khi có thay đổi, nhà tuyển dụng sẽ được yêu cầu đồng ý lại ở lần đăng nhập kế tiếp trước khi tiếp tục dùng tài khoản.',
        ],
    },
    {
        title: '9. Liên hệ',
        items: ['[Cần bổ sung: email hoặc đơn vị tiếp nhận khiếu nại và hỗ trợ nhà tuyển dụng.]'],
    },
];

export const EmployerTermsContent = () => (
    <div className={s.terms}>
        <p className={s.draft}>
            Bản nháp cho đồ án, cần được người chịu trách nhiệm xem xét trước khi dùng cho nhà tuyển dụng thật.
        </p>
        <p className={s.version}>Phiên bản {TERMS_VERSION_LABEL}</p>
        {SECTIONS.map(section => (
            <section key={section.title}>
                <h2>{section.title}</h2>
                <ul>
                    {section.items.map(item => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </section>
        ))}
    </div>
);

export const TermsModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
    <Modal
        open={open}
        onCancel={onClose}
        centered
        destroyOnClose
        width={640}
        title="Điều khoản sử dụng dành cho nhà tuyển dụng"
        okText="Đóng"
        cancelButtonProps={{ style: { display: 'none' } }}
        onOk={onClose}
    >
        <div className={s.modalBody}>
            <EmployerTermsContent />
        </div>
    </Modal>
);
