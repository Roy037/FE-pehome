import { ReactNode } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import d from '@/styles/discovery.module.scss';

export const pageItemRender = (_page: number, type: string, original: ReactNode) =>
    type === 'prev' ? (
        <span className={d.pageNav}>
            <LeftOutlined aria-hidden="true" /> Trước
        </span>
    ) : type === 'next' ? (
        <span className={d.pageNav}>
            Sau <RightOutlined aria-hidden="true" />
        </span>
    ) : (
        original
    );
