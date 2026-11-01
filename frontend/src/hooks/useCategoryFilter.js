import { useEffect, useMemo, useRef, useState } from "react";

import {
  createAllCategorySet,
  filterLocationsByCategories,
  getLocationCategories,
  normalizeCategoryKey,
  toggleCategorySelection,
} from "../components/categoryUtils";

export default function useCategoryFilter(locations = []) {
  const categories = useMemo(
    () => getLocationCategories(locations),
    [locations],
  );
  const categoryKeys = useMemo(
    () => new Set(categories.map(normalizeCategoryKey)),
    [categories],
  );
  const [selectedCategories, setSelectedCategories] = useState(
    () => createAllCategorySet(locations),
  );
  const [allCategoriesSelected, setAllCategoriesSelected] = useState(true);
  const seenCategories = useRef(new Set(categoryKeys));

  useEffect(() => {
    const newlyDiscovered = [...categoryKeys].filter(
      (category) => !seenCategories.current.has(category),
    );
    if (!newlyDiscovered.length) return;

    newlyDiscovered.forEach((category) => seenCategories.current.add(category));
    if (allCategoriesSelected) {
      setSelectedCategories((current) => new Set([...current, ...newlyDiscovered]));
    }
  }, [categoryKeys, allCategoriesSelected]);

  function toggleCategory(category) {
    const next = toggleCategorySelection(selectedCategories, category);
    setSelectedCategories(next);
    setAllCategoriesSelected([...categoryKeys].every((key) => next.has(key)));
  }

  function selectAllCategories() {
    const allSelected = new Set(categoryKeys);
    categoryKeys.forEach((category) => seenCategories.current.add(category));
    setSelectedCategories(allSelected);
    setAllCategoriesSelected(true);
  }

  function clearAllCategories() {
    setSelectedCategories(new Set());
    setAllCategoriesSelected(false);
  }

  const filteredLocations = useMemo(
    () => filterLocationsByCategories(locations, selectedCategories),
    [locations, selectedCategories],
  );

  return {
    categories,
    selectedCategories,
    filteredLocations,
    toggleCategory,
    selectAllCategories,
    clearAllCategories,
  };
}
