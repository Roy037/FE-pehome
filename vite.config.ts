import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used by the commented-out bundle analyzer below
import { visualizer } from 'rollup-plugin-visualizer';
import dns from 'dns';

//running on localhost instead of IP 127.0.0.1
// https://vitejs.dev/config/server-options.html#server-host
dns.setDefaultResultOrder('verbatim');

// https://vitejs.dev/config/
// https://v2.vitejs.dev/config/#environment-variables
export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [
            react(),
            // visualizer() as PluginOption
        ],
        server: {
            port: parseInt(env.PORT),
        },
        build: {
            // the first-load bundle is dominated by antd core (~1 MB); everything admin-only stays in lazy chunks, so do not force antd into one shared vendor chunk
            chunkSizeWarningLimit: 1200,
            rollupOptions: {
                output: {
                    manualChunks(id: string) {
                        if (!id.includes('node_modules')) return;
                        if (
                            /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|@remix-run|react-redux|@reduxjs|redux|redux-thunk|immer|reselect)\//.test(
                                id,
                            )
                        )
                            return 'react-vendor';
                    },
                },
            },
        },
        resolve: {
            alias: {
                '@': path.resolve(import.meta.dirname, './src/'),
                components: `${path.resolve(import.meta.dirname, './src/components/')}`,
                styles: `${path.resolve(import.meta.dirname, './src/styles/')}`,
                config: `${path.resolve(import.meta.dirname, './src/config/')}`,
                pages: `${path.resolve(import.meta.dirname, './src/pages/')}`,
            },
        },
    };
});
