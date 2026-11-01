import {
  BedDouble,
  GraduationCap,
  Landmark,
  MapPin,
  Trophy,
  Utensils,
  Wrench,
} from "lucide-react";

import { getCategoryDisplayName } from "./categoryUtils.js";

export const CATEGORY_STYLES = {
  Academic: { color: "#ec4899", Icon: GraduationCap },
  Facilities: { color: "#14b8a6", Icon: Wrench },
  Food: { color: "#f97316", Icon: Utensils },
  Hostel: { color: "#a855f7", Icon: BedDouble },
  Landmark: { color: "#3b82f6", Icon: Landmark },
  Sports: { color: "#fb7185", Icon: Trophy },
};

export const DEFAULT_CATEGORY_STYLE = {
  color: "#cbd5e1",
  Icon: MapPin,
};

export function getCategoryStyle(category) {
  return CATEGORY_STYLES[getCategoryDisplayName(category)] || DEFAULT_CATEGORY_STYLE;
}
