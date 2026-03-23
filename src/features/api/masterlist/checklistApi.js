import { apiSlice } from "../../../app/apiSlice";

const checklistApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChecklists: builder.query({
      query: ({ status = 1, search = "", page = 1, per_page = 10 } = {}) => ({
        url: "/api/checklists",
        params: { status, search, page, per_page },
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
  useGetChecklistsQuery,
  useGetChecklistByIdQuery,
  useCreateChecklistMutation,
  useUpdateChecklistMutation,
  useArchiveChecklistMutation,
} = checklistApi;
