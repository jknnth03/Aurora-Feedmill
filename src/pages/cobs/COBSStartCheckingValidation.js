import * as Yup from "yup";

const SCORE_OPTIONS = [0, 50, 75, 100];

export const buildValidationSchema = (questionnaireData) => {
  const rowShape = {};

  questionnaireData?.items?.forEach((category) => {
    category.items?.forEach((item, itemIdx) => {
      item.sub_items?.forEach((_, subIdx) => {
        const key = `${category.name}__${item.name}__${itemIdx}__${subIdx}`;
        rowShape[`score__${key}`] = Yup.number()
          .typeError("Score is required.")
          .required("Score is required.")
          .oneOf(SCORE_OPTIONS, "Score is required.");
        rowShape[`remarks__${key}`] = Yup.string()
          .trim()
          .required("Remarks is required.");
      });
    });
  });

  return Yup.object({
    ...rowShape,
    start_at: Yup.string().trim().required("Date is required."),
    temporal_audit: Yup.string().trim().required("Temporal Audit is required."),
    good_points: Yup.string().trim().required("Good Points is required."),
    remarks: Yup.string().trim().required("Remarks is required."),
  });
};

export const buildValidationValues = (
  answers,
  remarks,
  startAt,
  temporalAudit,
  goodPoints,
  othersRemarks,
  questionnaireData,
) => {
  const values = {
    start_at: startAt,
    temporal_audit: temporalAudit,
    good_points: goodPoints,
    remarks: othersRemarks,
  };

  questionnaireData?.items?.forEach((category) => {
    category.items?.forEach((item, itemIdx) => {
      item.sub_items?.forEach((_, subIdx) => {
        const key = `${category.name}__${item.name}__${itemIdx}__${subIdx}`;
        values[`score__${key}`] = answers[key] ?? undefined;
        values[`remarks__${key}`] = remarks[key] ?? "";
      });
    });
  });

  return values;
};

export const validateForm = async (
  isCompleted,
  {
    answers,
    remarks,
    startAt,
    temporalAudit,
    goodPoints,
    othersRemarks,
    questionnaireData,
  },
) => {
  if (isCompleted === 0) {
    if (!startAt)
      return { valid: false, errors: { start_at: "Date is required." } };
    return { valid: true, errors: {} };
  }

  const schema = buildValidationSchema(questionnaireData);
  const values = buildValidationValues(
    answers,
    remarks,
    startAt,
    temporalAudit,
    goodPoints,
    othersRemarks,
    questionnaireData,
  );

  try {
    await schema.validate(values, { abortEarly: false });
    return { valid: true, errors: {} };
  } catch (err) {
    const errors = {};
    err.inner.forEach((e) => {
      if (e.path) errors[e.path] = e.message;
    });
    return { valid: false, errors };
  }
};
