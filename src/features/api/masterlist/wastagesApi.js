import { apiSlice } from "../../../app/apiSlice";

const wastagesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWastages: builder.query({
      query: ({ status = 1, search = "", page = 1, per_page = 10 } = {}) => ({
        url: "/api/wastages",
        params: { status, search, page, per_page },
      }),
      providesTags: ["Wastages"],
    }),

    getWastageById: builder.query({
      query: (id) => ({
        url: `/api/wastages/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Wastages", id }],
    }),

    createWastage: builder.mutation({
      query: (body) => ({
        url: "/api/wastages",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Wastages"],
    }),

    updateWastage: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/wastages/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Wastages"],
    }),

    archiveWastage: builder.mutation({
      query: (id) => ({
        url: `/api/wastages/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Wastages"],
    }),
  }),
});

export const {
  useGetWastagesQuery,
  useGetWastageByIdQuery,
  useCreateWastageMutation,
  useUpdateWastageMutation,
  useArchiveWastageMutation,
} = wastagesApi;
