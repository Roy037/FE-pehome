import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { callFetchDocument } from '@/config/api';
import CvViewerModal from './cv-viewer';

vi.mock('@/config/api', async importOriginal => ({
    ...(await importOriginal<typeof import('@/config/api')>()),
    callFetchDocument: vi.fn(),
}));

const fetchDocument = vi.mocked(callFetchDocument);
const WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const open = (file: string, name?: string) =>
    render(
        <CvViewerModal
            open
            endpoint="/api/v1/me/profile/cv?index=1"
            file={file}
            name={name}
            onClose={() => undefined}
        />,
    );

describe('CvViewerModal', () => {
    beforeEach(() => {
        fetchDocument.mockReset();
    });

    it('shows a PDF inside the page and asks the endpoint it was given', async () => {
        fetchDocument.mockResolvedValue(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));
        open('1790000000000-u7-cv.pdf', 'CV tiếng Anh');

        expect(await screen.findByTitle('Xem trước CV CV tiếng Anh')).toBeInTheDocument();
        expect(fetchDocument).toHaveBeenCalledWith('/api/v1/me/profile/cv?index=1');
    });

    it('shows an image certificate as a picture', async () => {
        fetchDocument.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
        open('1790000000000-u7-ielts.png', 'IELTS 7.5');

        expect(await screen.findByRole('img', { name: 'CV IELTS 7.5' })).toBeInTheDocument();
    });

    it('offers a Word file as a download because browsers cannot preview it', async () => {
        fetchDocument.mockResolvedValue(new Blob(['PK'], { type: WORD }));
        open('1790000000000-u7-cv.docx', 'CV tiếng Việt');

        expect(await screen.findByText('Định dạng này chưa hỗ trợ xem trước')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Tải CV về/ })).toHaveAttribute('download', 'CV tiếng Việt');
    });

    it('names the file without its upload timestamp when it has no label', async () => {
        fetchDocument.mockResolvedValue(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));
        open('1790000000000-cv.pdf');

        expect(await screen.findByTitle('Xem trước CV cv.pdf')).toBeInTheDocument();
    });

    it('treats a JSON error body as a failure and can try again', async () => {
        fetchDocument
            .mockResolvedValueOnce(new Blob(['{"statusCode":403}'], { type: 'application/json' }))
            .mockResolvedValueOnce(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));
        open('1790000000000-u7-cv.pdf', 'CV tiếng Anh');

        expect(await screen.findByText('Chưa tải được CV')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Thử lại/ }));

        expect(await screen.findByTitle('Xem trước CV CV tiếng Anh')).toBeInTheDocument();
        expect(fetchDocument).toHaveBeenCalledTimes(2);
    });
});
