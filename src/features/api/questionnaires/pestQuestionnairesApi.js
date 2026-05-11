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
  }),
});

export const {
  useGetPestsSheetsQuery,
  useGetPestsSheetByIdQuery,
  useCreatePestsSheetMutation,
  useUpdatePestsSheetMutation,
  useArchivePestsSheetMutation,
} = pestsSheetsApi;
