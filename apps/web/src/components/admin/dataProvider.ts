import simpleRestProvider from "ra-data-simple-rest";
import { fetchUtils, type DataProvider } from "react-admin";

/**
 * Custom HTTP client for the data provider
 * @param url - The URL to fetch
 * @param options - The options for the fetch
 * @returns The response from the fetch
 */
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

/**
 * Get the data provider for the given API endpoint
 * @param apiEndpoint - The API endpoint
 * @returns The data provider
 */
export const getDataProvider = (apiEndpoint: string) => {
  const restEndpoint = apiEndpoint.endsWith("/")
    ? apiEndpoint.substring(0, apiEndpoint.length - 1)
    : apiEndpoint;

  const baseDataProvider = simpleRestProvider(restEndpoint, httpClient);

  const mappedDataProvider: DataProvider = {
    ...baseDataProvider,
    getList: (resource, params) => {
      if (resource === "tags" || resource === "categories") {
        return baseDataProvider.getList("taxonomies", {
          ...params,
          filter: {
            ...params.filter,
            type: resource === "tags" ? "tag" : "category",
          },
        });
      }
      return baseDataProvider.getList(resource, params);
    },
    getOne: (resource, params) => {
      if (resource === "tags" || resource === "categories") {
        return baseDataProvider.getOne("taxonomies", params);
      }
      return baseDataProvider.getOne(resource, params);
    },
    create: (resource, params) => {
      if (resource === "tags" || resource === "categories") {
        return baseDataProvider.create("taxonomies", {
          ...params,
          data: {
            ...params.data,
            type: resource === "tags" ? "tag" : "category",
          },
        });
      }
      return baseDataProvider.create(resource, params);
    },
    update: (resource, params) => {
      if (resource === "tags" || resource === "categories") {
        return baseDataProvider.update("taxonomies", {
          ...params,
          data: {
            ...params.data,
            type: resource === "tags" ? "tag" : "category",
          },
        });
      }
      return baseDataProvider.update(resource, params);
    },
    delete: (resource, params) => {
      if (resource === "tags" || resource === "categories") {
        return baseDataProvider.delete("taxonomies", params);
      }
      return baseDataProvider.delete(resource, params);
    },
  };
  return mappedDataProvider;
};
