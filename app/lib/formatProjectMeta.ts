export function formatProjectMeta(category: string, imageCount: number) {
  const categoryLetter = category.trim().charAt(0).toUpperCase();
  const end = String(imageCount).padStart(2, '0');

  return `${categoryLetter} 01-${end}`;
}
