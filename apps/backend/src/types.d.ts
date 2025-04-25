import type { Context } from "hono";
import type { Action, Permission, Resource, Role } from "./v1/acl";

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
    can: (resource: Resource, action: Action) => boolean
  }
};
