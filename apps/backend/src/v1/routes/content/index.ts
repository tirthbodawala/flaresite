import { contentListRoute, contentListHandler } from "./contentList.route";
import {
  contentGetByIdRoute,
  contentGetByIdHandler,
} from "./contentGetById.route";
import {
  contentCreateRoute,
  contentCreateHandler,
} from "./contentCreate.route";
import { contentEditRoute, contentEditHandler } from "./contentEdit.route";
import {
  contentDeleteByIdHandler,
  contentDeleteByIdRoute,
} from "./contentDelete.route";

export default [
  { route: contentListRoute, handler: contentListHandler },
  { route: contentGetByIdRoute, handler: contentGetByIdHandler },
  { route: contentCreateRoute, handler: contentCreateHandler },
  { route: contentEditRoute, handler: contentEditHandler },
  { route: contentDeleteByIdRoute, handler: contentDeleteByIdHandler },
];
