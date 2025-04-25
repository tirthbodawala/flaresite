import { taxonomyListRoute, taxonomyListHandler } from "./taxonomyList.route";
import {
  taxonomyGetByIdRoute,
  taxonomyGetByIdHandler,
} from "./taxonomyGetById.route";
import {
  taxonomyCreateRoute,
  taxonomyCreateHandler,
} from "./taxonomyCreate.route";

export default [
  { route: taxonomyListRoute, handler: taxonomyListHandler },
  { route: taxonomyGetByIdRoute, handler: taxonomyGetByIdHandler },
  { route: taxonomyCreateRoute, handler: taxonomyCreateHandler },
];
