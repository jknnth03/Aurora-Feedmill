export const validateForm = async (
  isCompleted,
  { infestationLevel, treatmentDose, entryPoints, questionnaireData },
) => {
  if (isCompleted === 0) {
    return { valid: true, errors: {} };
  }

  const errors = {};
  const inspectionAreas =
    questionnaireData?.items?.find((s) => s.name === "Inspection Areas")
      ?.items ?? [];

  inspectionAreas.forEach((area) => {
    const level = infestationLevel[area.name];

    if (!level) {
      errors[`infestation__${area.name}`] =
        `${area.name} — Infestation Level is required.`;
      return;
    }

    const isLow = level.toLowerCase() === "low";

    if (!isLow) {
      if (!treatmentDose[area.name]?.trim()) {
        errors[`treatment__${area.name}`] =
          `${area.name} — Treatment / Action Dose is required.`;
      }
      if (!entryPoints[area.name]?.trim()) {
        errors[`entry__${area.name}`] =
          `${area.name} — Identify Entry Points is required.`;
      }
    }
  });

  return { valid: Object.keys(errors).length === 0, errors };
};
