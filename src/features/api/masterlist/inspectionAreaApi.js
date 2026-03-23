import { apiSlice } from "../../../app/apiSlice";

const inspectionAreaApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInspectionAreas: builder.query({
      query: ({ status = 1, search = "", page = 1, per_page = 10 } = {}) => ({
        url: "/api/inspection-areas",
        params: { status, search, page, per_page },
      }),
      providesTags: ["InspectionAreas"],
    }),

    getInspectionAreaById: builder.query({
      query: (id) => ({
        url: `/api/inspection-areas/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "InspectionAreas", id }],
    }),

    createInspectionArea: builder.mutation({
      query: (body) => ({
        url: "/api/inspection-areas",
        method: "POST",
        body,
      }),
      invalidatesTags: ["InspectionAreas"],
    }),

    updateInspectionArea: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/inspection-areas/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["InspectionAreas"],
    }),

    archiveInspectionArea: builder.mutation({
      query: (id) => ({
        url: `/api/inspection-areas/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["InspectionAreas"],
    }),
  }),
});

export const {
  useGetInspectionAreasQuery,
  useGetInspectionAreaByIdQuery,
  useCreateInspectionAreaMutation,
  useUpdateInspectionAreaMutation,
  useArchiveInspectionAreaMutation,
} = inspectionAreaApi;
