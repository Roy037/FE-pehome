// Run: node scripts/check-auth.cjs (no server or credentials required).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const axios = require('axios');
const { configureStore } = require('@reduxjs/toolkit');
const values = new Map();
const localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
};
function load(file, mocks) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
        .replace(/import\.meta\.env\.VITE_BACKEND_URL/g, "'http://api.test'");
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    const exports = {};
    new Function('require', 'exports', 'localStorage', 'window', 'location', code)(
        id => Object.hasOwn(mocks, id) ? mocks[id] : require(id), exports,
        localStorage, { localStorage }, { pathname: '/job' });
    return exports;
}
async function main() {
    let accountResponse;
    const account = load('src/redux/slice/accountSlide.ts', {
        '@/config/api': { callFetchAccount: async () => accountResponse },
    });
    let store = configureStore({ reducer: account.default });
    assert.equal(store.getState().isLoading, false, 'Guests must reach login without an infinite loader');
    localStorage.setItem('access_token', 'expired');
    const savedAccount = load('src/redux/slice/accountSlide.ts', {
        '@/config/api': { callFetchAccount: async () => accountResponse },
    });
    store = configureStore({ reducer: savedAccount.default });
    assert.equal(store.getState().isLoading, true, 'Stored sessions must be checked before protected content');
    const user = { id: '7', name: 'Test candidate', email: 'candidate@example.test', role: { name: 'NORMAL_USER', permissions: [] } };
    accountResponse = { data: { user } };
    const pending = store.dispatch(savedAccount.fetchAccount());
    assert.equal(store.getState().isLoading, true);
    await pending;
    assert.equal(store.getState().isAuthenticated, true);
    assert.equal(store.getState().user.role.name, 'NORMAL_USER');
    assert.equal(store.getState().isLoading, false);
    accountResponse = {};
    await store.dispatch(savedAccount.fetchAccount());
    assert.equal(store.getState().isAuthenticated, false, 'Empty account responses must not authenticate');
    assert.equal(store.getState().isLoading, false);
    accountResponse = undefined;
    await store.dispatch(savedAccount.fetchAccount());
    assert.equal(store.getState().isLoading, false, 'Missing responses must finish loading');
    store.dispatch(savedAccount.setUserLoginInfo(structuredClone(user)));
    assert.equal(store.getState().user.role.name, 'NORMAL_USER', 'Login must preserve the role');

    const requests = [];
    let refreshMode = 'ok';
    const networkError = new Error('Network unavailable');
    const fail = (config, status) => Promise.reject({ config, response: { status, data: { statusCode: status, message: 'Request failed' } } });
    const adapter = async config => {
        requests.push({ url: config.url, bearer: config.headers.Authorization });
        if (config.url === '/network') throw networkError;
        let data = { ok: true };
        if (config.url === '/api/v1/auth/refresh') {
            if (refreshMode === 'network') throw networkError;
            if (refreshMode === 'invalid') return fail(config, 401);
            data = { access_token: 'fresh-token' };
        } else if (config.url === '/always-401' || !['/api/v1/auth/login', '/api/v1/auth/register'].includes(config.url)
            && config.headers.Authorization !== 'Bearer fresh-token') return fail(config, 401);
        return { config, status: 200, statusText: 'OK', headers: {}, data: { statusCode: 200, data } };
    };
    const client = load('src/config/axios-customize.ts', {
        axios: { default: { create: options => axios.create({ ...options, adapter }) } },
        '@/redux/store': { store },
        '@/redux/slice/accountSlide': savedAccount,
        antd: { notification: { error() {} } },
    }).default;
    for (const url of ['/api/v1/auth/login', '/api/v1/auth/register']) {
        await client.post(url, {});
        assert.equal(requests.at(-1).bearer, undefined, `${url} must not receive stale credentials`);
    }
    const refreshed = await client.get('/api/v1/auth/account');
    assert.equal(refreshed.data.ok, true, 'An expired request must succeed after refresh');
    assert.equal(requests.find(item => item.url === '/api/v1/auth/refresh').bearer, undefined);
    assert.equal(requests.at(-1).bearer, 'Bearer fresh-token');
    assert.equal(localStorage.getItem('access_token'), 'fresh-token');
    assert.equal(requests.filter(item => item.url === '/api/v1/auth/refresh').length, 1);
    const retryStart = requests.length;
    assert.equal((await client.get('/always-401')).statusCode, 401);
    assert.equal(requests.length - retryStart, 3, 'A retried 401 must stop after one refresh');
    await assert.rejects(client.get('/network'), error => error === networkError, 'Network errors without response must remain the original error');
    for (refreshMode of ['invalid', 'network']) {
        localStorage.setItem('access_token', 'expired');
        store.dispatch(savedAccount.setUserLoginInfo(structuredClone(user)));
        const start = requests.length;
        const failed = await client.get('/api/v1/auth/account');
        assert.equal(failed.statusCode, 401, 'Refresh failure must preserve the original API response');
        assert.equal(requests.length - start, 2, 'Failed refresh must not recurse or retry indefinitely');
        assert.equal(store.getState().isAuthenticated, false);
        assert.equal(store.getState().isLoading, false);
        assert.equal(localStorage.getItem('access_token'), null, 'Failed refresh must clear stale credentials');
    }
    console.log('Auth regression checks passed: guest/session lifecycle, role preservation, expired-token refresh, invalid refresh and network errors.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
