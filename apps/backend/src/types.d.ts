import type { Context } from "hono";
import type { Permission, Role } from "./acl";

export type PayloadUser = {
  id: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;

};

export type AppContext = {
  Bindings: Env,
  Variables: {
    user?: PayloadUser,
    can: (str: Permission) => boolean
  }
};
