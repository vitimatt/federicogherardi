export function formatProjectMeta(category: string, imageCount: number, currentIndex?: number) {
  const categoryLetter = category.trim().charAt(0).toUpperCase();

  if (currentIndex !== undefined) {
    return `${categoryLetter} ${String(currentIndex + 1).padStart(2, '0')}`;
  }

  const end = String(imageCount).padStart(2, '0');

  return `${categoryLetter} 01-${end}`;
}
