import { apiSlice } from "../../../app/apiSlice";

const pestTypesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPestTypes: builder.query({
      query: ({ status = 1, search = "", page = 1, per_page = 10 } = {}) => ({
        url: "/api/pests",
        params: { status, search, page, per_page },
      }),
      providesTags: ["PestTypes"],
    }),

    getPestTypeById: builder.query({
      query: (id) => ({
        url: `/api/pests/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "PestTypes", id }],
    }),

    createPestType: builder.mutation({
      query: (body) => ({
        url: "/api/pests",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PestTypes"],
    }),

    updatePestType: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/pests/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["PestTypes"],
    }),

    archivePestType: builder.mutation({
      query: (id) => ({
        url: `/api/pests/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PestTypes"],
    }),
  }),
});

export const {
  useGetPestTypesQuery,
  useGetPestTypeByIdQuery,
  useCreatePestTypeMutation,
  useUpdatePestTypeMutation,
  useArchivePestTypeMutation,
} = pestTypesApi;
