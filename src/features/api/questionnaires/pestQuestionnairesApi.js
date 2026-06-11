import { apiSlice } from "../../../app/apiSlice";

const pestsSheetsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPestsSheets: builder.query({
      query: ({ status = 1, search = "", page = 1, per_page = 10 } = {}) => ({
        url: "/api/sheets",
        params: { status, search, page, per_page },
      }),
      providesTags: ["PestsSheets"],
    }),

    getPestsSheetById: builder.query({
      query: (id) => ({
        url: `/api/sheets/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "PestsSheets", id }],
    }),

    createPestsSheet: builder.mutation({
      query: (body) => ({
        url: "/api/sheets",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PestsSheets"],
    }),

    updatePestsSheet: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/sheets/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["PestsSheets"],
    }),

    archivePestsSheet: builder.mutation({
      query: (id) => ({
        url: `/api/sheets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PestsSheets"],
    }),

    getChecklists: builder.query({
      query: ({ status = 1 } = {}) => ({
        url: "/api/checklists",
        params: { status, search: "pests" },
      }),
      providesTags: ["Checklists"],
    }),

    getChecklistById: builder.query({
      query: (id) => ({
        url: `/api/checklists/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Checklists", id }],
    }),

    createChecklist: builder.mutation({
      query: (body) => ({
        url: "/api/checklists",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Checklists"],
    }),

    updateChecklist: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/checklists/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Checklists"],
    }),

    archiveChecklist: builder.mutation({
      query: (id) => ({
        url: `/api/checklists/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Checklists"],
    }),
  }),
});

export const {
  useGetPestsSheetsQuery,
  useGetPestsSheetByIdQuery,
  useCreatePestsSheetMutation,
  useUpdatePestsSheetMutation,
  useArchivePestsSheetMutation,
  useGetChecklistsQuery,
  useGetChecklistByIdQuery,
  useCreateChecklistMutation,
  useUpdateChecklistMutation,
  useArchiveChecklistMutation,
} = pestsSheetsApi;
