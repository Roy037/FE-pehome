import { store } from '@/redux/store';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import '@/styles/global.scss';

document.documentElement.dataset.motion = 'on';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <Provider store={store}>
            <ConfigProvider
                locale={viVN}
                theme={{
                    token: {
                        colorPrimary: '#E3763C',
                        colorLink: '#A8491D',
                        colorLinkHover: '#873A16',
                        colorText: '#1F1A16',
                        colorTextSecondary: '#6B635C',
                        colorBorder: '#E8DCCF',
                        colorBorderSecondary: '#F1E7DC',
                        colorBgLayout: '#FFF7EF',
                        fontFamily: "'Poppins', system-ui, sans-serif",
                        borderRadius: 10,
                        controlHeight: 42,
                    },
                    components: {
                        Button: { primaryColor: '#1F1409', primaryShadow: 'none', fontWeight: 600 },
                        Checkbox: { colorWhite: '#1F1409' },
                        Rate: { starColor: '#F5A524' },
                    },
                }}
            >
                <App />
            </ConfigProvider>
        </Provider>
    </React.StrictMode>,
);
