import { userListRoute, userListHandler } from "./userList.route";
import { userGetByIdRoute, userGetByIdHandler } from "./userGetById.route";
import { userCreateRoute, userCreateHandler } from "./userCreate.route";

export default [
  { route: userListRoute, handler: userListHandler },
  { route: userGetByIdRoute, handler: userGetByIdHandler },
  { route: userCreateRoute, handler: userCreateHandler },
];
