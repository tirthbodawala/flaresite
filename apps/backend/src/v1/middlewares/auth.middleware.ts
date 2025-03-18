import { jwtVerify } from "jose"; // or any JWT library
import { type MiddlewareHandler } from "hono";
import type { AppContext, PayloadUser } from "@/types";
import { hasPermission, Permission, Role, ROLES } from "@/acl";

export const authMiddleware: MiddlewareHandler<AppContext> = async (
  c,
  next,
) => {
  try {
    let userRole: Role = "guest";
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring("Bearer ".length);
      // Verify with your secret key
      const secret = new TextEncoder().encode(c.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const { sub, role, firstName, lastName, email } = payload;
      userRole = (
        typeof role === "string" && ROLES.includes(role as Role)
          ? role
          : "guest"
      ) as Role;

      // For example, payload might have: { sub: 'userId', role: 'editor' }
      // Attach user data to context
      c.set("user", {
        id: sub,
        role,
        firstName,
        lastName,
        email,
      } as PayloadUser);
    }
    c.set("can", (permission: Permission) =>
      hasPermission(userRole, permission),
    );

    await next(); // proceed to the route
  } catch (err) {
    return c.json({ message: "Invalid or expired token" }, 401);
  }
};
