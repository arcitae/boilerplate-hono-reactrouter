// Re-export from frontend to satisfy React Router's requirement
// React Router expects app/entry.server.tsx at the app root
export { default, getLoadContext } from "./frontend/entry.server";

