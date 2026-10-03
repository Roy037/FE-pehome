import { ReactNode } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import d from '@/styles/discovery.module.scss';

// itemRender for antd's Pagination: "‹ Trước" and "Sau ›" as buttons, numbered pages are left to antd.
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
