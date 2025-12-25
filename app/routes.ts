import { type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default flatRoutes({
  // Routes are in app/frontend/routes directory
  rootDirectory: "client/routes",
}) satisfies RouteConfig;
// export default [
//   index("frontend/routes/home.tsx"),
//   route("/users", "frontend/routes/users.tsx"),
//   route("/posts", "frontend/routes/posts.tsx"),
// ] satisfies RouteConfig;
