import { apiSlice } from "../../../app/apiSlice";

const scoresApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getScores: builder.query({
      query: ({ status = 1, search = "", page = 1, per_page = 10 } = {}) => ({
        url: "/api/scores",
        params: { status, search, page, per_page },
      }),
      providesTags: ["Scores"],
    }),

    getScoreById: builder.query({
      query: (id) => ({
        url: `/api/scores/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Scores", id }],
    }),

    createScore: builder.mutation({
      query: (body) => ({
        url: "/api/scores",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Scores"],
    }),

    updateScore: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/scores/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Scores"],
    }),

    archiveScore: builder.mutation({
      query: (id) => ({
        url: `/api/scores/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Scores"],
    }),
  }),
});

export const {
  useGetScoresQuery,
  useGetScoreByIdQuery,
  useCreateScoreMutation,
  useUpdateScoreMutation,
  useArchiveScoreMutation,
} = scoresApi;
