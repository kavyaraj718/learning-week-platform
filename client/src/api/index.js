import client from './client.js';

const data = (p) => p.then((r) => r.data);

/* ---- Auth ---- */
export const authApi = {
  register: (body) => data(client.post('/auth/register', body)),
  login: (body) => data(client.post('/auth/login', body)),
  me: () => data(client.get('/auth/me')),
};

/* ---- Employees ---- */
export const employeesApi = {
  list: () => data(client.get('/employees')),
  get: (id) => data(client.get(`/employees/${id}`)),
  dashboard: (id) => data(client.get(`/employees/${id}/dashboard`)),
  pointsHistory: (id) => data(client.get(`/employees/${id}/points-history`)),
};

/* ---- Activities ---- */
export const activitiesApi = {
  list: () => data(client.get('/activities')),
  get: (id) => data(client.get(`/activities/${id}`)),
  create: (body) => data(client.post('/activities', body)),
  update: (id, body) => data(client.put(`/activities/${id}`, body)),
  remove: (id) => data(client.delete(`/activities/${id}`)),
  enroll: (id) => data(client.post(`/activities/${id}/enroll`)),
  registrations: (id) => data(client.get(`/activities/${id}/registrations`)),
  attendance: (id, body) => data(client.patch(`/activities/${id}/attendance`, body)),
  winners: (id, body) => data(client.post(`/activities/${id}/winners`, body)),
};

/* ---- Points ---- */
export const pointsApi = {
  bonus: (body) => data(client.post('/points/bonus', body)),
  getConfig: () => data(client.get('/points/config')),
  updateConfig: (body) => data(client.put('/points/config', body)),
};

/* ---- Leaderboards ---- */
export const leaderboardsApi = {
  organization: (limit) => data(client.get('/leaderboards/organization', { params: { limit } })),
  team: () => data(client.get('/leaderboards/team')),
  teamDetail: (manager) => data(client.get(`/leaderboards/team/${encodeURIComponent(manager)}`)),
  department: () => data(client.get('/leaderboards/department')),
  location: () => data(client.get('/leaderboards/location')),
};

/* ---- Analytics ---- */
export const analyticsApi = {
  participation: (params) => data(client.get('/analytics/participation', { params })),
  engagement: (params) => data(client.get('/analytics/engagement', { params })),
  team: () => data(client.get('/analytics/team')),
  trends: (params) => data(client.get('/analytics/trends', { params })),
};

/* ---- Recognition ---- */
export const recognitionApi = {
  get: () => data(client.get('/recognition')),
};

/* ---- Integration ---- */
export const integrationApi = {
  status: () => data(client.get('/integration/social/status')),
  sync: () => data(client.post('/integration/social/sync')),
};

/* ---- Stats ---- */
export const statsApi = {
  live: () => data(client.get('/stats/live')),
};

/* ---- Bulk upload ---- */
export const uploadApi = {
  send: (type, file, mode = 'apply') => {
    const form = new FormData();
    form.append('file', file);
    form.append('mode', mode);
    return data(client.post(`/upload/${type}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }));
  },
  templateUrl: (type) => `${import.meta.env.VITE_API_URL || ''}/api/upload/template/${type}`,
};
