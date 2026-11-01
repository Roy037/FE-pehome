export const ALL_PERMISSIONS = {
    COMPANIES: {
        GET_PAGINATE: { method: 'GET', apiPath: '/api/v1/companies', module: 'COMPANIES' },
        CREATE: { method: 'POST', apiPath: '/api/v1/companies', module: 'COMPANIES' },
        UPDATE: { method: 'PUT', apiPath: '/api/v1/companies', module: 'COMPANIES' },
        DELETE: { method: 'DELETE', apiPath: '/api/v1/companies/{id}', module: 'COMPANIES' },
        APPROVE: { method: 'PUT', apiPath: '/api/v1/companies/{id}/approve', module: 'COMPANIES' },
        REJECT: { method: 'PUT', apiPath: '/api/v1/companies/{id}/reject', module: 'COMPANIES' },
    },
    JOBS: {
        GET_PAGINATE: { method: 'GET', apiPath: '/api/v1/jobs', module: 'JOBS' },
        CREATE: { method: 'POST', apiPath: '/api/v1/jobs', module: 'JOBS' },
        UPDATE: { method: 'PUT', apiPath: '/api/v1/jobs', module: 'JOBS' },
        DELETE: { method: 'DELETE', apiPath: '/api/v1/jobs/{id}', module: 'JOBS' },
        LOCK: { method: 'PUT', apiPath: '/api/v1/jobs/{id}/lock', module: 'JOBS' },
        UNLOCK: { method: 'PUT', apiPath: '/api/v1/jobs/{id}/unlock', module: 'JOBS' },
    },
    TALENTS: {
        GET_PAGINATE: { method: 'GET', apiPath: '/api/v1/talents', module: 'TALENTS' },
    },
    ORDERS: {
        GET_PAGINATE: { method: 'GET', apiPath: '/api/v1/orders', module: 'ORDERS' },
    },
    STATS: {
        GET: { method: 'GET', apiPath: '/api/v1/admin/stats', module: 'STATS' },
    },
    JOB_REPORTS: {
        GET_PAGINATE: { method: 'GET', apiPath: '/api/v1/job-reports', module: 'JOB_REPORTS' },
        DELETE: { method: 'DELETE', apiPath: '/api/v1/job-reports/{id}', module: 'JOB_REPORTS' },
    },
    PERMISSIONS: {
        GET_PAGINATE: { method: 'GET', apiPath: '/api/v1/permissions', module: 'PERMISSIONS' },
        CREATE: { method: 'POST', apiPath: '/api/v1/permissions', module: 'PERMISSIONS' },
        UPDATE: { method: 'PUT', apiPath: '/api/v1/permissions', module: 'PERMISSIONS' },
        DELETE: { method: 'DELETE', apiPath: '/api/v1/permissions/{id}', module: 'PERMISSIONS' },
    },
    RESUMES: {
        GET_PAGINATE: { method: 'GET', apiPath: '/api/v1/resumes', module: 'RESUMES' },
        CREATE: { method: 'POST', apiPath: '/api/v1/resumes', module: 'RESUMES' },
        UPDATE: { method: 'PUT', apiPath: '/api/v1/resumes', module: 'RESUMES' },
        CHANGE_STATUS: { method: 'PUT', apiPath: '/api/v1/resumes/{id}/status', module: 'RESUMES' },
        EVALUATE: { method: 'PUT', apiPath: '/api/v1/resumes/{id}/evaluation', module: 'RESUMES' },
        DELETE: { method: 'DELETE', apiPath: '/api/v1/resumes/{id}', module: 'RESUMES' },
    },
    ROLES: {
        GET_PAGINATE: { method: 'GET', apiPath: '/api/v1/roles', module: 'ROLES' },
        CREATE: { method: 'POST', apiPath: '/api/v1/roles', module: 'ROLES' },
        UPDATE: { method: 'PUT', apiPath: '/api/v1/roles', module: 'ROLES' },
        DELETE: { method: 'DELETE', apiPath: '/api/v1/roles/{id}', module: 'ROLES' },
    },
    REVIEWS: {
        GET_PAGINATE: { method: 'GET', apiPath: '/api/v1/reviews', module: 'REVIEWS' },
        CREATE: { method: 'POST', apiPath: '/api/v1/reviews', module: 'REVIEWS' },
        UPDATE: { method: 'PUT', apiPath: '/api/v1/reviews', module: 'REVIEWS' },
        DELETE: { method: 'DELETE', apiPath: '/api/v1/reviews/{id}', module: 'REVIEWS' },
    },
    SAVED_JOBS: {
        GET_PAGINATE: { method: 'GET', apiPath: '/api/v1/saved-jobs', module: 'SAVED_JOBS' },
        CREATE: { method: 'POST', apiPath: '/api/v1/saved-jobs', module: 'SAVED_JOBS' },
        DELETE: { method: 'DELETE', apiPath: '/api/v1/saved-jobs/{id}', module: 'SAVED_JOBS' },
    },
    SUBSCRIBERS: {
        GET_PAGINATE: { method: 'GET', apiPath: '/api/v1/subscribers', module: 'SUBSCRIBERS' },
        CREATE: { method: 'POST', apiPath: '/api/v1/subscribers', module: 'SUBSCRIBERS' },
        UPDATE: { method: 'PUT', apiPath: '/api/v1/subscribers/{id}', module: 'SUBSCRIBERS' },
        DELETE: { method: 'DELETE', apiPath: '/api/v1/subscribers/{id}', module: 'SUBSCRIBERS' },
    },
    USERS: {
        GET_PAGINATE: { method: 'GET', apiPath: '/api/v1/users', module: 'USERS' },
        CREATE: { method: 'POST', apiPath: '/api/v1/users', module: 'USERS' },
        UPDATE: { method: 'PUT', apiPath: '/api/v1/users', module: 'USERS' },
        DELETE: { method: 'DELETE', apiPath: '/api/v1/users/{id}', module: 'USERS' },
        LOCK: { method: 'PUT', apiPath: '/api/v1/users/{id}/lock', module: 'USERS' },
        UNLOCK: { method: 'PUT', apiPath: '/api/v1/users/{id}/unlock', module: 'USERS' },
    },
};

export const ALL_MODULES = {
    COMPANIES: 'COMPANIES',
    FILES: 'FILES',
    JOBS: 'JOBS',
    PERMISSIONS: 'PERMISSIONS',
    RESUMES: 'RESUMES',
    REVIEWS: 'REVIEWS',
    SAVED_JOBS: 'SAVED_JOBS',
    ROLES: 'ROLES',
    USERS: 'USERS',
    SUBSCRIBERS: 'SUBSCRIBERS',
    JOB_REPORTS: 'JOB_REPORTS',
    ORDERS: 'ORDERS',
    STATS: 'STATS',
    TALENTS: 'TALENTS',
};
