import {
  BedDouble,
  GraduationCap,
  Landmark,
  MapPin,
  Trophy,
  Utensils,
  Wrench,
} from "lucide-react";

export const LOCATION_CATEGORY_CONFIG = {
  academic: { label: "Academic", color: "#EC4899", Icon: GraduationCap },
  facilities: { label: "Facilities", color: "#14B8A6", Icon: Wrench },
  food: { label: "Food", color: "#F97316", Icon: Utensils },
  hostel: { label: "Hostel", color: "#A855F7", Icon: BedDouble },
  landmark: { label: "Landmark", color: "#3B82F6", Icon: Landmark },
  sports: { label: "Sports", color: "#FB7185", Icon: Trophy },
};

export const UNKNOWN_CATEGORY_CONFIG = {
  label: "Other",
  color: "#94A3B8",
  Icon: MapPin,
};

export const LOCATION_CATEGORY_LIST = Object.values(LOCATION_CATEGORY_CONFIG);
export const LOCATION_CATEGORY_KEYS = Object.keys(LOCATION_CATEGORY_CONFIG);

export function normalizeCategoryName(category) {
  return String(category ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function getLocationCategoryConfig(category) {
  return LOCATION_CATEGORY_CONFIG[normalizeCategoryName(category)] ?? UNKNOWN_CATEGORY_CONFIG;
}

export function filterLocationsByCategories(locations, selectedCategories) {
  const allCategoriesSelected = LOCATION_CATEGORY_KEYS.every((category) =>
    selectedCategories.has(category)
  );

  // Preserve unknown-category locations in the initial / Select All view.
  if (allCategoriesSelected) return locations;

  return locations.filter((location) =>
    selectedCategories.has(normalizeCategoryName(location.category))
  );
}
