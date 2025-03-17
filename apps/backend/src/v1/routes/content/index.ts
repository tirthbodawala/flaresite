import { contentListRoute, contentListHandler } from './contentList.route';
import {
  contentGetByIdRoute,
  contentGetByIdHandler,
} from './contentGetById.route';
import {
  contentCreateRoute,
  contentCreateHandler,
} from './contentCreate.route';

export default [
  { route: contentListRoute, handler: contentListHandler },
  { route: contentGetByIdRoute, handler: contentGetByIdHandler },
  { route: contentCreateRoute, handler: contentCreateHandler },
];
