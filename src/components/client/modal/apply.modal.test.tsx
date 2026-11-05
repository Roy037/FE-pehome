import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { callCheckApplied, callCreateResume, callFetchMyProfile } from '@/config/api';
import accountReducer from '@/redux/slice/accountSlide';
import { IJob } from '@/types/backend';
import ApplyModal from './apply.modal';

vi.mock('@/config/api', async importOriginal => ({
    ...(await importOriginal<typeof import('@/config/api')>()),
    callCheckApplied: vi.fn(),
    callCreateResume: vi.fn(),
    callFetchMyProfile: vi.fn(),
}));

const JOB = { id: 40, name: 'Kỹ sư kiểm thử', company: { name: 'VINFAST' } } as unknown as IJob;

const savedFiles = (cvs: { url: string; name: string }[]) =>
    vi.mocked(callFetchMyProfile).mockResolvedValue({ data: { cvs } } as never);

const renderModal = () => {
    const signedOut = accountReducer(undefined, { type: 'init' });
    const store = configureStore({
        reducer: { account: accountReducer },
        preloadedState: {
            account: {
                ...signedOut,
                isAuthenticated: true,
                user: { ...signedOut.user, id: '7', email: 'an@example.com', name: 'An' },
            },
        },
    });
    return render(
        <Provider store={store}>
            <MemoryRouter>
                <ApplyModal isModalOpen setIsModalOpen={() => undefined} jobDetail={JOB} />
            </MemoryRouter>
        </Provider>,
    );
};

const send = () => fireEvent.click(screen.getByRole('button', { name: 'Gửi hồ sơ' }));

describe('ApplyModal with files saved on the profile', () => {
    beforeEach(() => {
        vi.mocked(callCheckApplied).mockResolvedValue({ data: { applied: false } } as never);
        vi.mocked(callCreateResume)
            .mockReset()
            .mockResolvedValue({ data: { id: 1 } } as never);
    });

    it('lets the candidate pick which saved file to send', async () => {
        savedFiles([
            { url: '1790000000000-u7-cv-en.pdf', name: 'CV tiếng Anh' },
            { url: '1790000000001-u7-ielts.png', name: 'IELTS 7.5' },
        ]);
        renderModal();

        expect(await screen.findByText('Chọn tệp trong hồ sơ của bạn')).toBeInTheDocument();
        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Chọn tệp để nộp' }));
        fireEvent.click(await screen.findByTitle('IELTS 7.5'));
        send();

        await waitFor(() =>
            expect(callCreateResume).toHaveBeenCalledWith('1790000000001-u7-ielts.png', 40, 'an@example.com', '7', ''),
        );
    });

    it('sends the first saved file when the candidate does not choose', async () => {
        savedFiles([
            { url: '1790000000000-u7-cv-en.pdf', name: 'CV tiếng Anh' },
            { url: '1790000000001-u7-ielts.png', name: 'IELTS 7.5' },
        ]);
        renderModal();

        await screen.findByText('Chọn tệp trong hồ sơ của bạn');
        send();

        await waitFor(() =>
            expect(callCreateResume).toHaveBeenCalledWith('1790000000000-u7-cv-en.pdf', 40, 'an@example.com', '7', ''),
        );
    });

    it('shows a single saved file by name without a picker', async () => {
        savedFiles([{ url: '1790000000000-u7-cv-en.pdf', name: 'CV tiếng Anh' }]);
        renderModal();

        expect(await screen.findByText('CV trong hồ sơ của bạn')).toBeInTheDocument();
        expect(screen.getByText('CV tiếng Anh')).toBeInTheDocument();
        expect(screen.queryByRole('combobox', { name: 'Chọn tệp để nộp' })).not.toBeInTheDocument();
    });

    it('asks for an upload and keeps the send button off when nothing is saved', async () => {
        savedFiles([]);
        renderModal();

        await waitFor(() => expect(callFetchMyProfile).toHaveBeenCalled());
        expect(screen.queryByText('CV trong hồ sơ của bạn')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Gửi hồ sơ' })).toBeDisabled();
    });

    it('switches to uploading another file and can come back to the saved one', async () => {
        savedFiles([{ url: '1790000000000-u7-cv-en.pdf', name: 'CV tiếng Anh' }]);
        renderModal();

        fireEvent.click(await screen.findByRole('button', { name: 'Dùng CV khác' }));
        expect(screen.getByRole('button', { name: 'Gửi hồ sơ' })).toBeDisabled();

        fireEvent.click(screen.getByRole('button', { name: 'Dùng CV trong hồ sơ (CV tiếng Anh)' }));
        send();

        await waitFor(() =>
            expect(callCreateResume).toHaveBeenCalledWith('1790000000000-u7-cv-en.pdf', 40, 'an@example.com', '7', ''),
        );
    });
});
