import { apiSlice } from "../../../app/apiSlice";

const pestApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getPestResponses: builder.query({
      query: ({ month, year, search = "", section = "" } = {}) => ({
        url: "/api/responses",
        params: { month, year, search, section },
      }),
      providesTags: ["Pest"],
    }),

    storePestResponse: builder.mutation({
      query: (body) => ({
        url: "/api/responses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Pest"],
    }),

    getPestQuestionnaire: builder.query({
      query: (id = 6) => ({
        url: `/api/questionnaires/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Pest", id }],
    }),

    getPestSummaryReport: builder.query({
      query: ({ month, year } = {}) => ({
        url: "/api/responses/summary",
        params: { month, year },
      }),
      providesTags: ["Pest"],
    }),

    mergePest: builder.mutation({
      query: ({ month, year }) => ({
        url: "/api/responses/merge",
        method: "POST",
        params: { month, year },
      }),
      invalidatesTags: ["Pest"],
    }),
  }),
});

export const {
  useGetPestResponsesQuery,
  useStorePestResponseMutation,
  useGetPestQuestionnaireQuery,
  useGetPestSummaryReportQuery,
  useMergePestMutation,
} = pestApi;
