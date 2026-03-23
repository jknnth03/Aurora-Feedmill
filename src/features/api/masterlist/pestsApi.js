import { apiSlice } from "../../../app/apiSlice";

const pestsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPests: builder.query({
      query: ({ status = 1, search = "", page = 1, per_page = 10 } = {}) => ({
        url: "/api/pests",
        params: { status, search, page, per_page },
      }),
      providesTags: ["Pests"],
    }),

    getPestById: builder.query({
      query: (id) => ({
        url: `/api/pests/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Pests", id }],
    }),

    createPest: builder.mutation({
      query: (body) => ({
        url: "/api/pests",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Pests"],
    }),

    updatePest: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/pests/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Pests"],
    }),

    archivePest: builder.mutation({
      query: (id) => ({
        url: `/api/pests/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Pests"],
    }),
  }),
});

export const {
  useGetPestsQuery,
  useGetPestByIdQuery,
  useCreatePestMutation,
  useUpdatePestMutation,
  useArchivePestMutation,
} = pestsApi;
