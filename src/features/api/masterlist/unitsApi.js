import { apiSlice } from "../../../app/apiSlice";

const unitsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUnits: builder.query({
      query: ({ status = 1, search = "", page = 1, per_page = 10 } = {}) => ({
        url: "/api/units",
        params: { status, search, page, per_page },
      }),
      providesTags: ["Units"],
    }),

    getUnitById: builder.query({
      query: (id) => ({
        url: `/api/units/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Units", id }],
    }),

    createUnit: builder.mutation({
      query: (body) => ({
        url: "/api/units",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Units"],
    }),

    updateUnit: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/units/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Units"],
    }),

    archiveUnit: builder.mutation({
      query: (id) => ({
        url: `/api/units/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Units"],
    }),
  }),
});

export const {
  useGetUnitsQuery,
  useGetUnitByIdQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useArchiveUnitMutation,
} = unitsApi;
