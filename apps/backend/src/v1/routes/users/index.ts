import { userListRoute, userListHandler } from './userList.route';
import { userGetByIdRoute, userGetByIdHandler } from './userGetById.route';
import { userCreateRoute, userCreateHandler } from './userCreate.route';
import { userRegisterRoute, userRegisterHandler } from './userRegister.route';
import { userLoginRoute, userLoginHandler } from './userLogin.route';

export default [
  { route: userListRoute, handler: userListHandler },
  { route: userGetByIdRoute, handler: userGetByIdHandler },
  { route: userCreateRoute, handler: userCreateHandler },
  { route: userRegisterRoute, handler: userRegisterHandler },
  { route: userLoginRoute, handler: userLoginHandler },
];
