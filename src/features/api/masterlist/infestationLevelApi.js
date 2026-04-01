import { apiSlice } from "../../../app/apiSlice";

const infestationLevelApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInfestationLevels: builder.query({
      query: ({ status = 1, search = "", page = 1, per_page = 10 } = {}) => ({
        url: "/api/infestation-levels",
        params: { status, search, page, per_page },
      }),
      providesTags: ["InfestationLevels"],
    }),

    getInfestationLevelById: builder.query({
      query: (id) => ({
        url: `/api/infestation-levels/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "InfestationLevels", id }],
    }),

    createInfestationLevel: builder.mutation({
      query: (body) => ({
        url: "/api/infestation-levels",
        method: "POST",
        body,
      }),
      invalidatesTags: ["InfestationLevels"],
    }),

    updateInfestationLevel: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/infestation-levels/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["InfestationLevels"],
    }),

    archiveInfestationLevel: builder.mutation({
      query: (id) => ({
        url: `/api/infestation-levels/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["InfestationLevels"],
    }),
  }),
});

export const {
  useGetInfestationLevelsQuery,
  useGetInfestationLevelByIdQuery,
  useCreateInfestationLevelMutation,
  useUpdateInfestationLevelMutation,
  useArchiveInfestationLevelMutation,
} = infestationLevelApi;
