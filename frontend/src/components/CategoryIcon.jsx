import { getCategoryStyle } from "./categoryConfig";

export default function CategoryIcon({ category, size = 20, strokeWidth = 2.1 }) {
  const { Icon } = getCategoryStyle(category);
  return <Icon aria-hidden="true" size={size} strokeWidth={strokeWidth} />;
}
