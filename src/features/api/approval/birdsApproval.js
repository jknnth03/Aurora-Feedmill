import { apiSlice } from "../../../app/apiSlice";

const birdsApproval = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getBirdsQuestionnaire: builder.query({
      query: (id = 1) => ({
        url: `/api/questionnaires/${id}`,
        params: { section: "birds" },
      }),
      providesTags: (result, error, id) => [{ type: "Birds", id }],
    }),

    getBirdsApprovals: builder.query({
      query: ({ month, year, search = "", status = "" } = {}) => ({
        url: "/api/approvals",
        params: { month, year, search, status, section: "birds" },
      }),
      providesTags: ["BirdsApprovals"],
    }),

    approveBirdsApproval: builder.mutation({
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
        formData.append("section", "birds");
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
      invalidatesTags: ["BirdsApprovals", "ApprovalsStatusCount"],
    }),
  }),
});

export const {
  useGetBirdsQuestionnaireQuery,
  useGetBirdsApprovalsQuery,
  useApproveBirdsApprovalMutation,
} = birdsApproval;
