import { decodeJwt } from "jose";
import type { UserIdentity } from "react-admin";

type Permissions = { [key: string]: { action: string; resource: string }[] };

export const authProvider = (apiEndpoint: string) => {
  const removeLocalTokens = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authPermissions");
  };
  const provider = {
    login: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      const data = await fetch(new URL("login", apiEndpoint), {
        method: "POST",
        body: JSON.stringify({
          usernameOrEmail: username,
          plainPassword: password,
        }),
        headers: new Headers({ "Content-Type": "application/json" }),
      });
      if (data.status < 200 || data.status >= 300) {
        throw new Error(data.statusText);
      }
      const { token } = (await data.json()) as { token: string };

      const permissionsData = await fetch(new URL("acl", apiEndpoint), {
        method: "GET",
        headers: new Headers({
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }),
      });

      const permissions = await permissionsData.json();
      localStorage.setItem("authPermissions", JSON.stringify(permissions));
      localStorage.setItem("authToken", token);
    },
    logout: () => {
      // Remove authentication token and any other stored data.
      removeLocalTokens();
      return Promise.resolve();
    },
    checkAuth: () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        const decoded = decodeJwt(token);
        if (decoded.exp && decoded.exp > Date.now() / 1000) {
          return Promise.resolve();
        }
      }
      return Promise.reject();
    },
    checkError: (error: unknown) => {
      console.log(error);
      // Handle authentication errors, such as token expiration.
      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        error.status === 401
      ) {
        removeLocalTokens();
        return Promise.reject();
      }
      return Promise.resolve();
    },
    getIdentity: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw Error("Invalid Authentication Token");
      }
      const decoded = decodeJwt(token);
      return {
        id: decoded.sub,
        fullName: decoded.firstName
          ? `${decoded.firstName} ${decoded.lastName}`
          : "",
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role || "guest",
        email: decoded.email || "",
      } as UserIdentity;
    },
    getPermissions: (): Promise<Permissions> => {
      const permissions = localStorage.getItem("authPermissions");
      if (!permissions) {
        return Promise.resolve({});
      }
      return Promise.resolve(JSON.parse(permissions));
    },
    canAccess: async ({
      resource,
      action,
    }: {
      resource: string;
      action: string;
    }) => {
      const derivedResource =
        resource === "tags" || resource === "categories"
          ? "taxonomies"
          : resource;
      const rolePermissions = (await provider.getPermissions())[
        (await provider.getIdentity()).role as string
      ];
      return rolePermissions.some(
        (permission) =>
          permission.resource === derivedResource &&
          permission.action === action,
      );
    },
  };
  return provider;
};
