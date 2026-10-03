import { ReactNode, useContext } from 'react';
import { ProProvider, viVNIntl } from '@ant-design/pro-components';

// ProTable/ProForm do not pick up the antd locale here and fall back to Chinese ("查询", "刷新", "请输入"...),
// so hand them the Vietnamese texts explicitly.
const ProLocale = ({ children }: { children: ReactNode }) => {
    const base = useContext(ProProvider);
    return <ProProvider.Provider value={{ ...base, intl: viVNIntl }}>{children}</ProProvider.Provider>;
};

export default ProLocale;
