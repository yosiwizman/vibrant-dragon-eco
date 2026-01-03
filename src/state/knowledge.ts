export type KnowledgeItem = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
};

const KEY = "echo:knowledge";

export function loadKnowledge(): KnowledgeItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as KnowledgeItem[]) : [];
  } catch {
    return [];
  }
}

export function saveKnowledge(items: KnowledgeItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addKnowledge(item: KnowledgeItem) {
  const items = loadKnowledge();
  items.unshift(item);
  saveKnowledge(items);
  return items;
}

export function removeKnowledge(id: string) {
  const items = loadKnowledge().filter((k) => k.id !== id);
  saveKnowledge(items);
  return items;
}

export function searchKnowledge(q: string) {
  const items = loadKnowledge();
  const needle = q.trim().toLowerCase();
  if (!needle) return items;
  return items.filter(
    (k) =>
      k.title.toLowerCase().includes(needle) ||
      k.content.toLowerCase().includes(needle) ||
      k.tags.some((t) => t.toLowerCase().includes(needle))
  );
}