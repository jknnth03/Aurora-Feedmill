import { apiSlice } from "../../../app/apiSlice";

const cobsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCobs: builder.query({
      query: ({ status = 1, search = "", page = 1, per_page = 10 } = {}) => ({
        url: "/api/forms",
        params: { status, search, page, per_page },
      }),
      providesTags: ["Cobs"],
    }),

    getCobsById: builder.query({
      query: (checklist_id) => ({
        url: `/api/forms/by-checklist`,
        method: "GET",
        body: { checklist_id },
      }),
      providesTags: (result, error, checklist_id) => [
        { type: "Cobs", id: checklist_id },
      ],
    }),

    createCobs: builder.mutation({
      query: (body) => ({
        url: "/api/forms",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Cobs"],
    }),

    updateCobs: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/forms/by-checklist`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Cobs"],
    }),

    archiveCobs: builder.mutation({
      query: (checklist_id) => ({
        url: `/api/forms/by-checklist`,
        method: "DELETE",
        body: { checklist_id },
      }),
      invalidatesTags: ["Cobs"],
    }),
  }),
});

export const {
  useGetCobsQuery,
  useLazyGetCobsByIdQuery,
  useCreateCobsMutation,
  useUpdateCobsMutation,
  useArchiveCobsMutation,
} = cobsApi;
