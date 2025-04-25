import { authRegisterRoute, authRegisterHandler } from "./authRegister.route";
import { authLoginRoute, authLoginHandler } from "./authLogin.route";
import { authACLRoute, authACLHandler } from "./authAcl.route";

export default [
  { route: authRegisterRoute, handler: authRegisterHandler },
  { route: authLoginRoute, handler: authLoginHandler },
  { route: authACLRoute, handler: authACLHandler },
];
