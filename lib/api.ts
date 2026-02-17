import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const workspaceId = window.localStorage.getItem("repolead.workspace_id");

    if (workspaceId && !config.headers["X-Workspace-Id"]) {
      config.headers["X-Workspace-Id"] = workspaceId;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status as number | undefined;
    const message =
      error?.response?.data?.message ||
      (status === 401
        ? "Unauthorized"
        : status === 403
          ? "Forbidden"
          : status === 422
            ? "Validation failed"
            : "Unexpected API error");

    return Promise.reject(
      Object.assign(new Error(message), {
        status,
        details: error?.response?.data?.errors,
      }),
    );
  },
);

export default api;
