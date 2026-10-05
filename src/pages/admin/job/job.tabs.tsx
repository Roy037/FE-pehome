import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import JobPage from './job';
import SkillPage from './skill';
import Access from '@/components/share/access';
import { ALL_PERMISSIONS } from '@/config/permissions';

const JobTabs = () => {
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Việc làm',
            children: <JobPage />,
        },
        {
            key: '2',
            label: 'Kỹ năng',
            children: <SkillPage />,
        },
    ];
    return (
        <div>
            <Access permission={ALL_PERMISSIONS.JOBS.GET_PAGINATE}>
                <Tabs defaultActiveKey="1" items={items} />
            </Access>
        </div>
    );
};

export default JobTabs;
