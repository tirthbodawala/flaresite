import contentRoutes from "./content";
import usersRoutes from "./users";
import authorsRoutes from "./authors";

export default [...usersRoutes, ...contentRoutes, ...authorsRoutes];
