import { apiSlice } from "../../../app/apiSlice";

const permissionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPermissions: builder.query({
      query: ({ status = 1, search = "", page = 1, per_page = 10 } = {}) => ({
        url: "/api/permissions",
        params: { status, search, page, per_page },
      }),
      providesTags: ["Permissions"],
    }),

    getPermissionById: builder.query({
      query: (id) => ({
        url: `/api/permissions/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Permissions", id }],
    }),

    createPermission: builder.mutation({
      query: (body) => ({
        url: "/api/permissions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Permissions"],
    }),

    updatePermission: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/permissions/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Permissions"],
    }),

    archivePermission: builder.mutation({
      query: (id) => ({
        url: `/api/permissions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Permissions"],
    }),
  }),
});

export const {
  useGetPermissionsQuery,
  useGetPermissionByIdQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useArchivePermissionMutation,
} = permissionsApi;
