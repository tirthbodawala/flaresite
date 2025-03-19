import { decodeJwt } from "jose";

export const authProvider = (apiEndpoint: string) => ({
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
    alert(token);
    localStorage.setItem("authToken", token);
  },
  logout: () => {
    // Remove authentication token and any other stored data.
    localStorage.removeItem("authToken");
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
    // Handle authentication errors, such as token expiration.
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error.status === 401 || error.status === 403)
    ) {
      localStorage.removeItem("authToken");
      return Promise.reject();
    }
    return Promise.resolve();
  },
  getPermissions: () => {
    // Return user permissions if applicable.
    return Promise.resolve();
  },
});
