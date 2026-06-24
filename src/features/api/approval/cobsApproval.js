import { apiSlice } from "../../../app/apiSlice";

const cobsApproval = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getCobApproval: builder.query({
      query: ({ month, year, search = "" } = {}) => ({
        url: "/api/responses",
        params: { month, year, search, section: "cobs" },
      }),
      providesTags: ["Cobs"],
    }),

    createCobApproval: builder.mutation({
      query: (body) => ({
        url: "/api/responses",
        method: "POST",
        body: { ...body, section: "cobs" },
      }),
      invalidatesTags: ["Cobs"],
    }),

    getCobApprovalQuestionnaire: builder.query({
      query: (id = 1) => ({
        url: `/api/questionnaires/${id}`,
        params: { section: "cobs" },
      }),
      providesTags: (result, error, id) => [{ type: "Cobs", id }],
    }),

    getCobApprovals: builder.query({
      query: ({ month, year, search = "", status = "" } = {}) => ({
        url: "/api/approvals",
        params: { month, year, search, status, section: "cobs" },
      }),
      providesTags: ["Approvals"],
    }),

    approveCobApproval: builder.mutation({
      query: ({
        batch_no,
        approver_id,
        assessor_id,
        approvers = [],
        signatureFile,
      }) => {
        const formData = new FormData();
        formData.append("batch_no", String(batch_no));
        formData.append("approver_id", String(approver_id));
        formData.append("section", "cobs");
        if (assessor_id) {
          formData.append("assessor_id", String(assessor_id));
        }
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
      invalidatesTags: ["Approvals", "ApprovalsStatusCount"],
    }),
  }),
});

export const {
  useGetCobApprovalQuery,
  useCreateCobApprovalMutation,
  useGetCobApprovalQuestionnaireQuery,
  useGetCobApprovalsQuery,
  useApproveCobApprovalMutation,
} = cobsApproval;
