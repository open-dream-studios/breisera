const local_server = true;
export const BACKEND_URL = local_server ? "https://localhost:8080" : "";
export const FRONTEND_URL = process.env.NODE_ENV === "development" ? "https://localhost:3000" : ""