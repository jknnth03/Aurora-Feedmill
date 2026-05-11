import { apiSlice } from "../../../app/apiSlice";

const birdsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBirds: builder.query({
      query: ({ status = 1, search = "", page = 1, per_page = 10 } = {}) => ({
        url: "/api/surveys",
        params: { status, search, page, per_page },
      }),
      providesTags: ["Birds"],
    }),

    getBirdById: builder.query({
      query: (id) => ({
        url: `/api/surveys/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Birds", id }],
    }),

    createBird: builder.mutation({
      query: (body) => ({
        url: "/api/surveys",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Birds"],
    }),

    updateBird: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/surveys/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Birds"],
    }),

    archiveBird: builder.mutation({
      query: (id) => ({
        url: `/api/surveys/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Birds"],
    }),
  }),
});

export const {
  useGetBirdsQuery,
  useGetBirdByIdQuery,
  useCreateBirdMutation,
  useUpdateBirdMutation,
  useArchiveBirdMutation,
} = birdsApi;
