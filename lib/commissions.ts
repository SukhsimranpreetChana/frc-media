import type { Commission } from "@/types";

export const commissionsStorageKey = "fmc-commissions";

export const defaultCommissions: Commission[] = [];

let cachedRawValue: string | null | undefined;
let cachedCommissions: Commission[] = defaultCommissions;

export function readStoredCommissions() {
  if (typeof window === "undefined") {
    return defaultCommissions;
  }

  const storedValue = window.localStorage.getItem(commissionsStorageKey);

  if (storedValue === cachedRawValue) {
    return cachedCommissions;
  }

  cachedRawValue = storedValue;

  if (!storedValue) {
    cachedCommissions = defaultCommissions;
    return cachedCommissions;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Commission[];

    if (!Array.isArray(parsedValue)) {
      cachedCommissions = defaultCommissions;
      return cachedCommissions;
    }

    cachedCommissions = parsedValue;
    return cachedCommissions;
  } catch {
    cachedCommissions = defaultCommissions;
    return cachedCommissions;
  }
}

export function writeStoredCommissions(commissions: Commission[]) {
  const nextRawValue = JSON.stringify(commissions);

  cachedRawValue = nextRawValue;
  cachedCommissions = commissions;

  window.localStorage.setItem(
    commissionsStorageKey,
    nextRawValue,
  );

  window.dispatchEvent(new Event("fmc-commissions-updated"));
}

export function subscribeToCommissions(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("fmc-commissions-updated", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("fmc-commissions-updated", onStoreChange);
  };
}
