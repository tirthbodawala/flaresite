import authRoutes from "./auth";
import contentRoutes from "./content";
import usersRoutes from "./users";
import authorsRoutes from "./authors";
import taxonomyRoutes from "./taxonomies";

export default [
  ...authRoutes,
  ...usersRoutes,
  ...contentRoutes,
  ...authorsRoutes,
  ...taxonomyRoutes,
];
