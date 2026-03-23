import { apiSlice } from "../../../app/apiSlice";

const rolesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query({
      query: ({ status = 1, search = "", page = 1, per_page = 10 } = {}) => ({
        url: "/api/roles",
        params: { status, search, page, per_page },
      }),
      providesTags: ["Roles"],
    }),

    getRoleById: builder.query({
      query: (id) => ({
        url: `/api/roles/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Roles", id }],
    }),

    createRole: builder.mutation({
      query: (body) => ({
        url: "/api/roles",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Roles"],
    }),

    updateRole: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/roles/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Roles"],
    }),

    archiveRole: builder.mutation({
      query: (id) => ({
        url: `/api/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Roles"],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useArchiveRoleMutation,
} = rolesApi;
