import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: fakeBaseQuery(),
  endpoints: () => ({}),
  tagTypes: ["Session", "Collections", "Bookmarks", "Profile"],
});
