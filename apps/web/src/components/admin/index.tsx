import {
  Admin,
  Resource,
  radiantLightTheme,
  radiantDarkTheme,
  ShowGuesser,
  EditGuesser,
  ListGuesser,
} from "react-admin";
import { authProvider } from "./authProvider";
import type { FC } from "react";
import { ContentList } from "./content/ContentList";
import { ContentEdit } from "./content/ContentEdit";
import { ContentShow } from "./content/ContentShow";
import { ContentCreate } from "./content/ContentCreate";
import { getDataProvider } from "./dataProvider";

const tagFilters = { type: "tag" };
const categoryFilters = { type: "category" };

export const ReactAdmin: FC<{
  apiEndpoint: string;
}> = ({ apiEndpoint }) => {
  const dataProvider = getDataProvider(apiEndpoint);
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
        show={ContentShow}
        edit={ContentEdit}
        create={ContentCreate}
      />
      <Resource
        name="users"
        list={ListGuesser}
        show={ShowGuesser}
        edit={EditGuesser}
        create={EditGuesser}
      />
      <Resource
        name="tags"
        list={ListGuesser}
        show={ShowGuesser}
        edit={EditGuesser}
        create={EditGuesser}
      />
      <Resource
        name="categories"
        list={ListGuesser}
        show={ShowGuesser}
        edit={EditGuesser}
        create={EditGuesser}
      />
    </Admin>
  );
};
