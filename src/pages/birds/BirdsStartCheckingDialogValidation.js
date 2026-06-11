export const validateForm = async (
  isCompleted,
  { infestationLevel, treatmentDose, entryPoints, questionnaireData },
) => {
  // Draft save — no validation needed
  if (isCompleted === 0) {
    return { valid: true, errors: {} };
  }

  const errors = {};
  const inspectionAreas =
    questionnaireData?.items?.find((s) => s.name === "Inspection Areas")
      ?.items ?? [];

  inspectionAreas.forEach((area) => {
    const level = infestationLevel[area.name];

    // Infestation level is always required
    if (!level) {
      errors[`infestation__${area.name}`] = "Required.";
      return; // skip further checks if no level selected
    }

    const isLow = level.toLowerCase() === "low";

    // Treatment dose and entry points are only required for average/moderate
    if (!isLow) {
      if (!treatmentDose[area.name]?.trim()) {
        errors[`treatment__${area.name}`] = "Required.";
      }
      if (!entryPoints[area.name]?.trim()) {
        errors[`entry__${area.name}`] = "Required.";
      }
    }
  });

  return { valid: Object.keys(errors).length === 0, errors };
};
