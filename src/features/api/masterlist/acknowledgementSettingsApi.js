import { apiSlice } from "../../../app/apiSlice";

const acknowledgementSettingsApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAcknowledgementSettings: builder.query({
      query: ({ status } = {}) => ({
        url: "/api/acknowledgement-settings",
        params: {
          status,
        },
      }),
      providesTags: ["AcknowledgementSettings"],
    }),

    getAcknowledgementSetting: builder.query({
      query: (id) => ({
        url: `/api/acknowledgement-settings/${id}`,
      }),
      providesTags: (result, error, id) => [
        { type: "AcknowledgementSettings", id },
      ],
    }),

    storeAcknowledgementSetting: builder.mutation({
      query: (body) => ({
        url: "/api/acknowledgement-settings",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AcknowledgementSettings"],
    }),

    updateAcknowledgementSetting: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/acknowledgement-settings/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "AcknowledgementSettings",
        { type: "AcknowledgementSettings", id },
      ],
    }),

    changeAcknowledgementSettingStatus: builder.mutation({
      query: (id) => ({
        url: `/api/acknowledgement-settings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AcknowledgementSettings"],
    }),
  }),
});

export const {
  useGetAcknowledgementSettingsQuery,
  useGetAcknowledgementSettingQuery,
  useStoreAcknowledgementSettingMutation,
  useUpdateAcknowledgementSettingMutation,
  useChangeAcknowledgementSettingStatusMutation,
} = acknowledgementSettingsApi;
