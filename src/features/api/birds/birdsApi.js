import { apiSlice } from "../../../app/apiSlice";

const birdsApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getBirds: builder.query({
      query: ({ month, year, search = "" } = {}) => ({
        url: "/api/responses",
        params: { month, year, section: "birds", search },
      }),
      providesTags: ["Birds"],
    }),

    createBird: builder.mutation({
      query: (body) => ({
        url: "/api/responses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Birds"],
    }),

    getBirdsQuestionnaireTemplate: builder.query({
      query: (id) => ({
        url: `/api/questionnaires/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Birds", id }],
    }),

    evaluateBirdResponse: builder.mutation({
      query: (formData) => ({
        url: "/api/responses/evaluate",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [],
    }),
  }),
});

export const {
  useGetBirdsQuery,
  useCreateBirdMutation,
  useGetBirdsQuestionnaireTemplateQuery,
  useEvaluateBirdResponseMutation,
} = birdsApi;
