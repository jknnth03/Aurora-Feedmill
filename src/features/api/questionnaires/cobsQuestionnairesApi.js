import { apiSlice } from "../../../app/apiSlice";

const cobsQuestionnairesApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getCobsQuestionnaires: builder.query({
      query: ({
        status = 1,
        search = "COBS",
        page = 1,
        per_page = 10,
      } = {}) => ({
        url: "/api/checklists",
        params: { status, search, page, per_page },
      }),
      providesTags: ["CobsQuestionnaires"],
    }),

    getCobsById: builder.query({
      query: (id) => ({
        url: `/api/checklists/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "CobsQuestionnaires", id }],
    }),

    createCobs: builder.mutation({
      query: (body) => ({
        url: "/api/checklists",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CobsQuestionnaires"],
    }),

    updateCobs: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/checklists/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["CobsQuestionnaires"],
    }),

    archiveCobs: builder.mutation({
      query: (id) => ({
        url: `/api/checklists/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CobsQuestionnaires"],
    }),
  }),
});

export const {
  useGetCobsQuestionnairesQuery,
  useGetCobsByIdQuery,
  useLazyGetCobsByIdQuery,
  useCreateCobsMutation,
  useUpdateCobsMutation,
  useArchiveCobsMutation,
} = cobsQuestionnairesApi;
