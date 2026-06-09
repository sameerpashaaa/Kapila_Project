const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function request(method, path, body, params) {
  // Support both absolute URLs and relative path bases
  const absoluteBase = BASE.startsWith("http") ? BASE : window.location.origin + BASE;
  const url = new URL(absoluteBase + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const errorText = await res.text();
    throw new Error(`Server returned HTML/text instead of JSON. Status: ${res.status}. Details: ${errorText.slice(0, 80)}...`);
  }

  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Request failed");
  return json;
}

export const api = {
  get:    (path, params) => request("GET",    path, null, params),
  post:   (path, body)   => request("POST",   path, body),
  patch:  (path, body)   => request("PATCH",  path, body),
  delete: (path)         => request("DELETE", path),

  // Multipart upload — bypasses JSON serialization
  postUpload: async (path, formData) => {
    const absoluteBase = BASE.startsWith("http") ? BASE : window.location.origin + BASE;
    const url = new URL(absoluteBase + path);
    const res = await fetch(url, { method: "POST", body: formData }); // no Content-Type header — browser sets it with boundary
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const errorText = await res.text();
      throw new Error(`Server error ${res.status}: ${errorText.slice(0, 120)}`);
    }
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Upload failed");
    return json;
  },
};
