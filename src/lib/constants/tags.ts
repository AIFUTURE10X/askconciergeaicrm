// Tag color options for contact categorization
export const TAG_COLORS = [
  {
    id: "gray",
    label: "Gray",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-700",
  },
  {
    id: "red",
    label: "Red",
    bg: "bg-red-100 dark:bg-red-900/50",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
  {
    id: "orange",
    label: "Orange",
    bg: "bg-orange-100 dark:bg-orange-900/50",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
  {
    id: "yellow",
    label: "Yellow",
    bg: "bg-yellow-100 dark:bg-yellow-900/50",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  {
    id: "green",
    label: "Green",
    bg: "bg-green-100 dark:bg-green-900/50",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
  },
  {
    id: "blue",
    label: "Blue",
    bg: "bg-blue-100 dark:bg-blue-900/50",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  {
    id: "purple",
    label: "Purple",
    bg: "bg-purple-100 dark:bg-purple-900/50",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  {
    id: "pink",
    label: "Pink",
    bg: "bg-pink-100 dark:bg-pink-900/50",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-800",
  },
] as const;

export type TagColorId = (typeof TAG_COLORS)[number]["id"];

export const getTagColor = (colorId: string) => {
  return TAG_COLORS.find((c) => c.id === colorId) || TAG_COLORS[0];
};
