import { ReactNode, useContext } from 'react';
import { ProProvider, viVNIntl } from '@ant-design/pro-components';

const ProLocale = ({ children }: { children: ReactNode }) => {
    const base = useContext(ProProvider);
    return <ProProvider.Provider value={{ ...base, intl: viVNIntl }}>{children}</ProProvider.Provider>;
};

export default ProLocale;
