export const KNOWN_CATEGORIES = [
  "Academic",
  "Facilities",
  "Food",
  "Hostel",
  "Landmark",
  "Sports",
];

export function getCleanCategoryName(category) {
  return typeof category === "string"
    ? category.trim().replace(/\s+/g, " ")
    : "";
}

export function normalizeCategoryKey(category) {
  return getCleanCategoryName(category).toLocaleLowerCase() || "__other__";
}

export function getCategoryDisplayName(category) {
  const cleanName = getCleanCategoryName(category);
  if (!cleanName) return "Other";

  return KNOWN_CATEGORIES.find(
    (knownCategory) => normalizeCategoryKey(knownCategory) === normalizeCategoryKey(cleanName),
  ) || cleanName;
}

export function getLocationCategories(locations = []) {
  const names = new Map(
    KNOWN_CATEGORIES.map((category) => [normalizeCategoryKey(category), category]),
  );

  locations.forEach((location) => {
    const category = getCategoryDisplayName(location.category);
    names.set(normalizeCategoryKey(category), category);
  });

  return [...names.values()];
}

export function createAllCategorySet(locations = []) {
  return new Set(getLocationCategories(locations).map(normalizeCategoryKey));
}

export function toggleCategorySelection(selectedCategories, category) {
  const next = new Set(selectedCategories);
  const key = normalizeCategoryKey(category);

  if (next.has(key)) next.delete(key);
  else next.add(key);

  return next;
}

export function filterLocationsByCategories(locations, selectedCategories) {
  return locations.filter((location) =>
    selectedCategories.has(normalizeCategoryKey(location.category)),
  );
}
