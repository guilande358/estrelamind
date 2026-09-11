// Session-only storage for visitor (guest) mode.
// Everything lives in sessionStorage and disappears when the session ends.

export type GuestCollection = "tasks" | "events" | "expenses";

const KEY = "mf_guest_data";

type Store = Record<GuestCollection, any[]>;

const empty = (): Store => ({ tasks: [], events: [], expenses: [] });

const read = (): Store => {
  if (typeof window === "undefined") return empty();
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
};

const write = (store: Store) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota errors */
  }
};

export const guestList = <T,>(collection: GuestCollection): T[] =>
  read()[collection] as T[];

export const guestInsert = <T extends Record<string, any>>(
  collection: GuestCollection,
  values: Record<string, any>
): T => {
  const store = read();
  const now = new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    user_id: "guest",
    created_at: now,
    updated_at: now,
    ...values,
  } as unknown as T;
  store[collection] = [...store[collection], row];
  write(store);
  return row;
};

export const guestUpdate = <T extends Record<string, any>>(
  collection: GuestCollection,
  id: string,
  updates: Record<string, any>
): T | null => {
  const store = read();
  let updated: any = null;
  store[collection] = store[collection].map((row: any) => {
    if (row.id !== id) return row;
    updated = { ...row, ...updates, updated_at: new Date().toISOString() };
    return updated;
  });
  write(store);
  return updated as T | null;
};

export const guestDelete = (collection: GuestCollection, id: string) => {
  const store = read();
  store[collection] = store[collection].filter((row: any) => row.id !== id);
  write(store);
};

export const guestClear = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
