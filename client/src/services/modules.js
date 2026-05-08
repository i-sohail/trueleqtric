// client/src/services/modules.js
import api from './api'

// ── Generic CRUD builder ─────────────────────────────
const crud = (base) => ({
  getAll:  (params) => api.get(base, { params }).then(r => r.data),
  getOne:  (id)     => api.get(`${base}/${id}`).then(r => r.data),
  create:  (data)   => api.post(base, data).then(r => r.data),
  update:  (id, data) => api.put(`${base}/${id}`, data).then(r => r.data),
  remove:  (id)     => api.delete(`${base}/${id}`).then(r => r.data),
})

// ── Dashboard ────────────────────────────────────────
export const dashboardApi = {
  getKPIs:         (params) => api.get('/dashboard/kpis', { params }).then(r => r.data),
  getPipeline:     ()       => api.get('/dashboard/pipeline-funnel').then(r => r.data),
  getAlerts:       ()       => api.get('/dashboard/alerts').then(r => r.data),
  getRecentOrders: ()       => api.get('/dashboard/recent-orders').then(r => r.data),
  getTicker:       ()       => api.get('/dashboard/ticker').then(r => r.data),
}

// ── Analytics ────────────────────────────────────────
export const analyticsApi = {
  getOverview:       ()       => api.get('/analytics/overview').then(r => r.data),
  getMonthlyTrend:   (year)   => api.get('/analytics/monthly-trend', { params: { year } }).then(r => r.data),
  getARAging:        ()       => api.get('/analytics/ar-aging').then(r => r.data),
  getCategoryRev:    ()       => api.get('/analytics/category-revenue').then(r => r.data),
  getSalesRepBoard:  ()       => api.get('/analytics/sales-rep-scoreboard').then(r => r.data),
  getForecast:       ()       => api.get('/analytics/forecast').then(r => r.data),
  getMarginWaterfall:()       => api.get('/analytics/margin-waterfall').then(r => r.data),
  getLeadFunnel:     ()       => api.get('/analytics/lead-funnel').then(r => r.data),
  getInsights:       ()       => api.get('/analytics/insights').then(r => r.data),
}

// ── Leads ────────────────────────────────────────────
export const leadsApi = {
  ...crud('/leads'),
  getStats:        ()   => api.get('/leads/stats').then(r => r.data),
  convertToQuote:  (id) => api.post(`/leads/${id}/convert-to-quote`).then(r => r.data),
}

// ── Quotations ───────────────────────────────────────
export const quotationsApi = {
  ...crud('/quotations'),
  getStats:       ()   => api.get('/quotations/stats').then(r => r.data),
  convertToPO:    (id) => api.post(`/quotations/${id}/convert-to-po`).then(r => r.data),
  getDocument:    (id) => api.get(`/quotations/${id}/document`).then(r => r.data),
}

// ── Sales PO ─────────────────────────────────────────
export const salespoApi = {
  ...crud('/salespo'),
  getStats:         ()         => api.get('/salespo/stats').then(r => r.data),
  createAR:         (id, data) => api.post(`/salespo/${id}/create-ar`, data).then(r => r.data),
  createProcurement:(id, data) => api.post(`/salespo/${id}/create-procurement`, data).then(r => r.data),
  getDocument:      (id)       => api.get(`/salespo/${id}/document`).then(r => r.data),
}

// ── Procurement ──────────────────────────────────────
export const procurementApi = {
  ...crud('/procurement'),
  createAP: (id, data) => api.post(`/procurement/${id}/create-ap`, data).then(r => r.data),
}

// ── Inventory ────────────────────────────────────────
export const inventoryApi = {
  ...crud('/inventory'),
  getStats: () => api.get('/inventory/stats').then(r => r.data),
}

// ── Delivery ─────────────────────────────────────────
export const deliveryApi = {
  ...crud('/delivery'),
  getStats: () => api.get('/delivery/stats').then(r => r.data),
}

// ── AR ───────────────────────────────────────────────
export const arApi = {
  ...crud('/ar'),
  getStats:       ()         => api.get('/ar/stats').then(r => r.data),
  recordPayment:  (id, data) => api.post(`/ar/${id}/record-payment`, data).then(r => r.data),
}

// ── AP ───────────────────────────────────────────────
export const apApi = {
  ...crud('/ap'),
  getStats:      ()         => api.get('/ap/stats').then(r => r.data),
  recordPayment: (id, data) => api.post(`/ap/${id}/record-payment`, data).then(r => r.data),
}

// ── Customers ────────────────────────────────────────
export const customersApi = {
  ...crud('/customers'),
  getSummary: (id) => api.get(`/customers/${id}/summary`).then(r => r.data),
}

// ── Vendors ──────────────────────────────────────────
export const vendorsApi = {
  ...crud('/vendors'),
  getSummary: (id) => api.get(`/vendors/${id}/summary`).then(r => r.data),
}

// ── Catalog ──────────────────────────────────────────
export const catalogApi = {
  ...crud('/catalog'),
  updatePrice:     (id, data) => api.put(`/catalog/${id}/price`, data).then(r => r.data),
  getPriceHistory: (id)       => api.get(`/catalog/${id}/price-history`).then(r => r.data),
}

// ── BGLC ─────────────────────────────────────────────
export const bglcApi = {
  ...crud('/bglc'),
  getStats: () => api.get('/bglc/stats').then(r => r.data),
}

// ── Tenders ──────────────────────────────────────────
export const tendersApi = {
  ...crud('/tenders'),
  getStats:        ()         => api.get('/tenders/stats').then(r => r.data),
  updateChecklist: (id, data) => api.put(`/tenders/${id}/checklist`, data).then(r => r.data),
}

// ── Documents ────────────────────────────────────────
export const documentsApi = {
  getAll:   (params) => api.get('/documents', { params }).then(r => r.data),
  getOne:   (id)     => api.get(`/documents/${id}`).then(r => r.data),
  upload:   (formData) => api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  update:   (id, data) => api.put(`/documents/${id}`, data).then(r => r.data),
  remove:   (id)     => api.delete(`/documents/${id}`).then(r => r.data),
  getDownloadUrl: (id) => `${api.defaults.baseURL}/documents/${id}/download`,
}

// ── Payment Schedules ────────────────────────────────
export const paymentScheduleApi = {
  ...crud('/payment-schedules'),
  updateMilestone: (id, milestoneId, data) => api.put(`/payment-schedules/${id}/milestones/${milestoneId}`, data).then(r => r.data),
}

// ── Production Tracking ──────────────────────────────
export const prodTrackingApi = crud('/prod-tracking')

// ── Commissions ──────────────────────────────────────
export const commissionsApi = {
  ...crud('/commissions'),
  getStats: () => api.get('/commissions/stats').then(r => r.data),
}

// ── Vendor Scores ────────────────────────────────────
export const vendorScoresApi = {
  ...crud('/vendor-scores'),
  getScorecard: () => api.get('/vendor-scores/scorecard').then(r => r.data),
}

// ── Credit Monitor ───────────────────────────────────
export const creditMonitorApi = {
  getExposure: () => api.get('/credit-monitor').then(r => r.data),
}

// ── Cash Flow ────────────────────────────────────────
export const cashFlowApi = {
  getProjection: () => api.get('/cash-flow').then(r => r.data),
}

// ── Lists ────────────────────────────────────────────
export const listsApi = {
  getAll:      ()              => api.get('/lists').then(r => r.data),
  updateList:  (key, values)   => api.put(`/lists/${key}`, { values }).then(r => r.data),
  addValue:    (key, value)    => api.post(`/lists/${key}/add`, { value }).then(r => r.data),
  removeValue: (key, value)    => api.post(`/lists/${key}/remove`, { value }).then(r => r.data),
}

// ── Sellers ──────────────────────────────────────────
export const sellersApi = {
  getAll:      (params)       => api.get('/sellers', { params }).then(r => r.data),
  addAsVendor: (data)         => api.post('/sellers/add-as-vendor', data).then(r => r.data),
}

// ── Tasks ────────────────────────────────────────────
export const tasksApi = {
  getAll:  (params) => api.get('/tasks', { params }).then(r => r.data),
  create:  (data)   => api.post('/tasks', data).then(r => r.data),
  update:  (id, data) => api.put(`/tasks/${id}`, data).then(r => r.data),
  remove:  (id)     => api.delete(`/tasks/${id}`).then(r => r.data),
}

// ── Trash ────────────────────────────────────────────
export const trashApi = {
  getAll:          ()   => api.get('/trash').then(r => r.data),
  restore:         (id) => api.post(`/trash/${id}/restore`).then(r => r.data),
  permanentDelete: (id) => api.delete(`/trash/${id}`).then(r => r.data),
  emptyTrash:      ()   => api.delete('/trash').then(r => r.data),
}

// ── Reports ──────────────────────────────────────────
export const reportsApi = {
  getMIS:          () => api.get('/reports/mis').then(r => r.data),
  getExcelUrl:     () => `${api.defaults.baseURL}/reports/excel`,
  getDocumentUrl:  (type, id) => `${api.defaults.baseURL}/reports/document/${type}/${id}`,
}

// ── Auth ─────────────────────────────────────────────
export const authApi = {
  login:          (data) => api.post('/auth/login', data).then(r => r.data),
  register:       (data) => api.post('/auth/register', data).then(r => r.data),
  getMe:          ()     => api.get('/auth/me').then(r => r.data),
  updateMe:       (data) => api.put('/auth/me', data).then(r => r.data),
  changePassword: (data) => api.put('/auth/change-password', data).then(r => r.data),
  getUsers:       ()     => api.get('/auth/users').then(r => r.data),
}

// ── Access Management ─────────────────────────────────
export const accessApi = {
  // Users
  getUsers:           (params) => api.get('/access/users', { params }).then(r => r.data),
  getUser:            (id)     => api.get(`/access/users/${id}`).then(r => r.data),
  createUser:         (data)   => api.post('/access/users', data).then(r => r.data),
  updateUser:         (id, data) => api.put(`/access/users/${id}`, data).then(r => r.data),
  deleteUser:         (id)     => api.delete(`/access/users/${id}`).then(r => r.data),
  resetPassword:      (id, data) => api.post(`/access/users/${id}/reset-password`, data).then(r => r.data),
  toggleStatus:       (id)     => api.patch(`/access/users/${id}/toggle-status`).then(r => r.data),
  // Roles
  getRoles:           ()       => api.get('/access/roles').then(r => r.data),
  getRole:            (id)     => api.get(`/access/roles/${id}`).then(r => r.data),
  createRole:         (data)   => api.post('/access/roles', data).then(r => r.data),
  updateRole:         (id, data) => api.put(`/access/roles/${id}`, data).then(r => r.data),
  deleteRole:         (id)     => api.delete(`/access/roles/${id}`).then(r => r.data),
}
