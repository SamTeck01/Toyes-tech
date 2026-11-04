const KEY = "toyes_recently_viewed";
const MAX = 10;

export const getRecentlyViewed = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export const addRecentlyViewed = (id: string) => {
  try {
    const next = [id, ...getRecentlyViewed().filter((x) => x !== id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* storage unavailable */ }
};
