export const validateForm = async (
  isCompleted,
  { pestGrid, otherObservations, questionnaireData },
) => {
  if (isCompleted === 0) {
    return { valid: true, errors: {} };
  }

  const errors = {};

  const inspectionAreas =
    questionnaireData?.items?.find((s) => s.name === "Inspection Areas")
      ?.items ?? [];

  const otherObsSection =
    questionnaireData?.items?.find((s) => s.name === "Other Observation")
      ?.items ?? [];

  inspectionAreas.forEach((area) => {
    otherObsSection.forEach((item) => {
      const key = `${area.name}__${item.name}`;
      if (!otherObservations[key]) {
        errors[`obs__${area.name}__${item.name}`] = "Required.";
      }
    });
  });

  return { valid: Object.keys(errors).length === 0, errors };
};
