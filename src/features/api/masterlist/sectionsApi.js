import { apiSlice } from "../../../app/apiSlice";

const sectionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSections: builder.query({
      query: ({ status = 1, search = "", page = 1, per_page = 10 } = {}) => ({
        url: "/api/sections",
        params: { status, search, page, per_page },
      }),
      providesTags: ["Sections"],
    }),

    getSectionById: builder.query({
      query: (id) => ({
        url: `/api/sections/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Sections", id }],
    }),

    createSection: builder.mutation({
      query: (body) => ({
        url: "/api/sections",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sections"],
    }),

    updateSection: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/sections/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Sections"],
    }),

    archiveSection: builder.mutation({
      query: (id) => ({
        url: `/api/sections/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Sections"],
    }),
  }),
});

export const {
  useGetSectionsQuery,
  useGetSectionByIdQuery,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useArchiveSectionMutation,
} = sectionsApi;
