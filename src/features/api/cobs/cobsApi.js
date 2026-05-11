import { apiSlice } from "../../../app/apiSlice";

const cobsApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getCobs: builder.query({
      query: ({ month, year, search = "" } = {}) => ({
        url: "/api/responses",
        params: { month, year, search },
      }),
      providesTags: ["Cobs"],
    }),

    createCob: builder.mutation({
      query: (body) => ({
        url: "/api/responses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Cobs"],
    }),

    getQuestionnaire: builder.query({
      query: (id = 1) => ({
        url: `/api/questionnaires/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Cobs", id }],
    }),
  }),
});

export const {
  useGetCobsQuery,
  useCreateCobMutation,
  useGetQuestionnaireQuery,
} = cobsApi;
