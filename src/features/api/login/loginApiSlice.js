import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => ({
        url: "/api/login",
        method: "POST",
        body,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/api/logout",
        method: "POST",
      }),
    }),
    getApprovalsStatusCount: builder.query({
      query: () => ({
        url: "/api/approvals/status-count",
        method: "GET",
      }),
      providesTags: ["ApprovalsStatusCount"],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetApprovalsStatusCountQuery,
} = extendedApi;
