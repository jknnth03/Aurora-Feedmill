import * as yup from "yup";

const subItemSchema = yup.object({
  name: yup.string().required("Sub-item name is required"),
  type: yup.string().required("Type is required"),
});

const areaSchema = yup.object({
  name: yup.string().required("Area name is required"),
  sub_items: yup
    .array()
    .of(subItemSchema)
    .min(1, "At least one sub-item is required"),
});

const categorySchema = yup.object({
  name: yup.string().required("Category name is required"),
  items: yup.array().of(areaSchema).min(1, "At least one area is required"),
});

export const cobsSchema = yup.object({
  checklist_name: yup.string().required("Checklist name is required"),
  items: yup
    .array()
    .of(categorySchema)
    .min(1, "At least one category is required"),
});

export const TYPE_OPTIONS = ["radio button", "checkbox", "text input"];
