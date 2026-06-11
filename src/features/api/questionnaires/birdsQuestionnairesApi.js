import { apiSlice } from "../../../app/apiSlice";

const birdsQuestionnairesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBirdsChecklists: builder.query({
      query: ({ status = 1, search = "", page = 1, per_page = 10 } = {}) => ({
        url: "/api/checklists",
        params: { status, search, page, per_page },
      }),
      providesTags: ["BirdsChecklists"],
    }),

    getBirdChecklistById: builder.query({
      query: (id) => ({ url: `/api/checklists/${id}` }),
      providesTags: (result, error, id) => [{ type: "BirdsChecklists", id }],
    }),

    createBirdChecklist: builder.mutation({
      query: (body) => ({
        url: "/api/checklists",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BirdsChecklists"],
    }),

    updateBirdChecklist: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/checklists/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["BirdsChecklists"],
    }),

    archiveBirdChecklist: builder.mutation({
      query: (id) => ({
        url: `/api/checklists/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BirdsChecklists"],
    }),
  }),
});

export const {
  useGetBirdsChecklistsQuery,
  useGetBirdChecklistByIdQuery,
  useCreateBirdChecklistMutation,
  useUpdateBirdChecklistMutation,
  useArchiveBirdChecklistMutation,
} = birdsQuestionnairesApi;
