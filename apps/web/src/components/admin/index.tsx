import {
  fetchUtils,
  Admin,
  Resource,
  radiantLightTheme,
  radiantDarkTheme,
  ShowGuesser,
  EditGuesser,
} from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";
import { authProvider } from "./authProvider";
import type { FC } from "react";
import { ContentList } from "./content/ContentList";
import { ContentEdit } from "./content/ContentEdit";

const httpClient = (url: string, options: RequestInit = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: "application/json" });
  } else {
    options.headers = new Headers(options.headers);
  }
  try {
    const authToken = localStorage.getItem("authToken");
    if (authToken) {
      options.headers.set("Authorization", `Bearer ${authToken}`);
    }
  } catch (error) {
    console.error(error);
  }

  return fetchUtils.fetchJson(url, options);
};

export const ReactAdmin: FC<{
  apiEndpoint: string;
}> = ({ apiEndpoint }) => {
  const restEndpoint = apiEndpoint.endsWith("/")
    ? apiEndpoint.substring(0, apiEndpoint.length - 1)
    : apiEndpoint;
  const dataProvider = simpleRestProvider(restEndpoint, httpClient);
  return (
    <Admin
      authProvider={authProvider(apiEndpoint)}
      dataProvider={dataProvider}
      theme={radiantLightTheme}
      darkTheme={radiantDarkTheme}
    >
      <Resource
        name="content"
        list={ContentList}
        show={ShowGuesser}
        edit={ContentEdit}
        create={EditGuesser}
      />
    </Admin>
  );
};
