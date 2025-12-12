import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("frontend/routes/home.tsx"),
  route("/users", "frontend/routes/users.tsx"),
  route("/posts", "frontend/routes/posts.tsx"),
] satisfies RouteConfig;
