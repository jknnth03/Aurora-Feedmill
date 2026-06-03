import { apiSlice } from "../../../app/apiSlice";

const cobsAcknowledgement = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAcknowledgements: builder.query({
      query: ({ status = "" } = {}) => ({
        url: "/api/assess",
        params: { status },
      }),
      providesTags: ["Acknowledgements"],
    }),

    assessAcknowledgement: builder.mutation({
      query: ({ batch_no, assessor_id, assess = [], assessImageFile }) => {
        const formData = new FormData();
        formData.append("batch_no", String(batch_no));
        formData.append("assessor_id", String(assessor_id));
        assess.forEach((item, i) => {
          formData.append(`assess[${i}]`, JSON.stringify(item));
        });
        if (assessImageFile) {
          formData.append(
            "assess_image[0]",
            assessImageFile,
            assessImageFile.name,
          );
        }
        return {
          url: "/api/assess/assess",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Acknowledgements"],
    }),
  }),
});

export const { useGetAcknowledgementsQuery, useAssessAcknowledgementMutation } =
  cobsAcknowledgement;
