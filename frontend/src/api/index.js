import { api } from "./client";

export const stock = {
  list:   (params) => api.get("/stock", params),
  create: (body)   => api.post("/stock", body),
  update: (id, payload) => api.patch(`/stock/${id}`, payload),
  remove: (id)     => api.delete(`/stock/${id}`),
  ledger:   () => api.get("/stock/ledger"),
  insights: () => api.get("/stock/insights"),
  available: (names) => api.get("/stock/available", { names: Array.isArray(names) ? names.join(",") : names }),
};

export const indents = {
  list:         (params) => api.get("/indents", params),
  create:       (body)   => api.post("/indents", body),
  updateStatus: (id, status) => api.patch(`/indents/${id}`, { status }),
};

export const issuances = {
  list:   (params) => api.get("/issuances", params),
  create: (body)   => api.post("/issuances", body),
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
};

export const search = {
  global: (q, modules) => api.get("/search", { q, modules }),
};

export const scan = {
  indent:   (image, mimeType) => api.post("/scan/indent", { image, mime_type: mimeType }),
  purchase: (image, mimeType) => api.post("/scan/purchase", { image, mime_type: mimeType }),
  text:     (text) => api.post("/scan/text", { text }),
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
  autoDraft:  (supplier_id) => api.post("/purchase-orders/auto-draft", { supplier_id }),
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
