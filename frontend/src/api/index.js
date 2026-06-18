import { api } from "./client";

export const stock = {
  list:   (params) => api.get("/stock", params),
  create: (body)   => api.post("/stock", body),
  update: (id, payload) => api.patch(`/stock/${id}`, payload),
  remove: (id)     => api.delete(`/stock/${id}`),
  ledger:   (params) => api.get("/stock/ledger", params),
  insights: () => api.get("/stock/insights"),
  available: (names) => api.get("/stock/available", { names: Array.isArray(names) ? names.join(",") : names }),
  reconcile: (body) => api.post("/stock/reconcile", body),
};

export const indents = {
  list:         (params) => api.get("/indents", params),
  create:       (body)   => api.post("/indents", body),
  updateStatus: (id, status) => api.patch(`/indents/${id}`, { status }),
  updateItems:  (id, items) => api.patch(`/indents/${id}/items`, { items }),
  remove:       (id) => api.delete(`/indents/${id}`),
};

export const issuances = {
  list:   (params) => api.get("/issuances", params),
  create: (body)   => api.post("/issuances", body),
  remove: (id)     => api.delete(`/issuances/${id}`),
};

export const production = {
  list:   (params) => api.get("/production", params),
  create: (body)   => api.post("/production", body),
};

export const leftovers = {
  list:   (params) => api.get("/leftovers", params),
  create: (body)   => api.post("/leftovers", body),
};

export const dashboard = {
  summary:   (date)   => api.get("/dashboard", { date }),
  analytics: (params) => api.get("/dashboard/analytics", params),
  procurement: (params) => api.get("/dashboard/procurement", params),
};

export const search = {
  global: (q, modules) => api.get("/search", { q, modules }),
};

export const scan = {
  indent:   (image, mimeType) => api.post("/scan/indent", { image, mime_type: mimeType }),
  purchase: (image, mimeType) => api.post("/scan/purchase", { image, mime_type: mimeType }),
  text:     (text) => api.post("/scan/text", { text }),
  voice:    (audio, mimeType) => api.post("/scan/voice", { audio, mime_type: mimeType }),
};

export const suppliers = {
  list:   (params) => api.get("/suppliers", params),
  create: (body)   => api.post("/suppliers", body),
  update: (id, body) => api.patch(`/suppliers/${id}`, body),
  remove: (id)     => api.delete(`/suppliers/${id}`),
  performance: (id) => api.get(`/suppliers/${id}/performance`),
};

export const purchaseOrders = {
  list:       (params) => api.get("/purchase-orders", params),
  getOne:     (id)     => api.get(`/purchase-orders/${id}`),
  create:     (body)   => api.post("/purchase-orders", body),
  update:     (id, body) => api.patch(`/purchase-orders/${id}`, body),
  remove:     (id)     => api.delete(`/purchase-orders/${id}`),
  autoDraft:  (supplier_id, preview = false) => api.post("/purchase-orders/auto-draft", { supplier_id, preview }),
};

export const grn = {
  list:   (params) => api.get("/grn", params),
  getOne: (id)     => api.get(`/grn/${id}`),
  create: (body)   => api.post("/grn", body),
  remove: (id)     => api.delete(`/grn/${id}`),
};

export const transfers = {
  list:   (params) => api.get("/transfers", params),
  getOne: (id)     => api.get(`/transfers/${id}`),
  create: (body)   => api.post("/transfers", body),
  accept: (id, body) => api.patch(`/transfers/${id}/accept`, body),
  reject: (id, body) => api.patch(`/transfers/${id}/reject`, body),
  remove: (id)     => api.delete(`/transfers/${id}`),
};

export const reorderPoints = {
  list:   (params) => api.get("/reorder-points", params),
  alerts: ()       => api.get("/reorder-points/alerts"),
  create: (body)   => api.post("/reorder-points", body),
  update: (id, body) => api.patch(`/reorder-points/${id}`, body),
  remove: (id)     => api.delete(`/reorder-points/${id}`),
};

export const departments = {
  list:   () => api.get("/departments"),
  items:  () => api.get("/departments/items"),
  create: (body)   => api.post("/departments", body),
  update: (id, body) => api.patch(`/departments/${id}`, body),
  remove: (id)     => api.delete(`/departments/${id}`),
};

export const recipes = {
  list: () => api.get("/recipes"),
  create: (body) => api.post("/recipes", body),
  update: (id, body) => api.patch(`/recipes/${id}`, body),
  remove: (id) => api.delete(`/recipes/${id}`),
};

export const productionPlans = {
  list: (params) => api.get("/production-plans", params),
  create: (body) => api.post("/production-plans", body),
  update: (id, body) => api.patch(`/production-plans/${id}`, body),
  remove: (id) => api.delete(`/production-plans/${id}`),
  analytics: (params) => api.get("/production-plans/analytics", params),
};

export const menu = {
  list: (params) => api.get("/menu", params),
  create: (body) => api.post("/menu", body),
  update: (id, body) => api.patch(`/menu/${id}`, body),
  remove: (id) => api.delete(`/menu/${id}`),
};

export const approvedDelivery = {
  // multipart upload: file (PDF/image) + supplier_id
  scan:   (formData) => api.postUpload("/approved-delivery/scan", formData),
  // JSON commit after user review
  commit: (body)     => api.post("/approved-delivery/commit", body),
};

export const auth = {
  login: (body) => api.post("/auth/login", body),
  me: () => api.get("/auth/me"),
  refresh: () => api.post("/auth/refresh"),
  logout: () => api.post("/auth/logout"),
  changePassword: (body) => api.post("/auth/change-password", body),
};

export const users = {
  list: (params) => api.get("/users", params),
  getOne: (id) => api.get(`/users/${id}`),
  create: (body) => api.post("/users", body),
  update: (id, body) => api.patch(`/users/${id}`, body),
  setActive: (id, is_active) => api.patch(`/users/${id}/activate`, { is_active }),
  resetPassword: (id, temporary_password) => api.post(`/users/${id}/reset-password`, { temporary_password }),
  activity: (id) => api.get(`/users/${id}/activity`),
};

export const roles = {
  list: () => api.get("/roles"),
};

export const permissions = {
  list: () => api.get("/permissions"),
};

export const auditLogs = {
  list: (params) => api.get("/audit-logs", params),
};

export const chefStats = {
  overview: (params) => api.get("/chef-stats", params),
  detail:   (deptId, params) => api.get(`/chef-stats/${deptId}`, params),
};
