import { authorsListRoute, authorsListHandler } from "./authorsList.route";
import {
  authorsGetByIdRoute,
  authorsGetByIdHandler,
} from "./authorsGetById.route";

export default [
  { route: authorsListRoute, handler: authorsListHandler },
  { route: authorsGetByIdRoute, handler: authorsGetByIdHandler },
];
