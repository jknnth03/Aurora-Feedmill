import { apiSlice } from "../../../app/apiSlice";

const pestsApproval = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getPests: builder.query({
      query: ({ month, year, search = "" } = {}) => ({
        url: "/api/responses",
        params: { month, year, search, section: "pests" },
      }),
      providesTags: ["Pests"],
    }),

    createPest: builder.mutation({
      query: (body) => ({
        url: "/api/responses",
        method: "POST",
        body: { ...body, section: "pests" },
      }),
      invalidatesTags: ["Pests"],
    }),

    getPestsQuestionnaire: builder.query({
      query: (id = 1) => ({
        url: `/api/questionnaires/${id}`,
        params: { section: "pests" },
      }),
      providesTags: (result, error, id) => [{ type: "Pests", id }],
    }),

    getPestsApprovals: builder.query({
      query: ({ month, year, search = "", status = "" } = {}) => ({
        url: "/api/approvals",
        params: { month, year, search, status, section: "pests" },
      }),
      providesTags: ["PestsApprovals"],
    }),

    approvePestsApproval: builder.mutation({
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
        formData.append("section", "pests");
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
      invalidatesTags: ["PestsApprovals"],
    }),
  }),
});

export const {
  useGetPestsQuery,
  useCreatePestMutation,
  useGetPestsQuestionnaireQuery,
  useGetPestsApprovalsQuery,
  useApprovePestsApprovalMutation,
} = pestsApproval;