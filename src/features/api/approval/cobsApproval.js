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

    getApprovals: builder.query({
      query: ({ month, year, search = "", status = "" } = {}) => ({
        url: "/api/approvals",
        params: { month, year, search, status },
      }),
      providesTags: ["Approvals"],
    }),

    approveApproval: builder.mutation({
      query: (batch_no) => ({
        url: "/api/approvals/approve",
        method: "PUT",
        params: { batch_no },
      }),
      invalidatesTags: ["Approvals"],
    }),
  }),
});

export const {
  useGetCobsQuery,
  useCreateCobMutation,
  useGetQuestionnaireQuery,
  useGetApprovalsQuery,
  useApproveApprovalMutation,
} = cobsApi;
