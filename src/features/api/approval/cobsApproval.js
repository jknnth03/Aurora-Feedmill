import { apiSlice } from "../../../app/apiSlice";

const cobsApproval = apiSlice.injectEndpoints({
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
      query: ({ batch_no, approver_id, approvers = [], signatureFile }) => {
        const formData = new FormData();
        formData.append("batch_no", String(batch_no));
        formData.append("approver_id", String(approver_id));
        approvers.forEach((approver, i) => {
          formData.append(`approve[${i}]`, JSON.stringify(approver));
        });
        if (signatureFile) {
          formData.append(
            "approve_image[0]",
            signatureFile,
            signatureFile.name,
          );
        }
        return {
          url: "/api/approvals/approve",
          method: "POST",
          body: formData,
        };
      },
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
} = cobsApproval;
