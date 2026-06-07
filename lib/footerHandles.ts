import type { FooterHandle } from "@/types";

export const footerHandlesStorageKey = "fmc-footer-handles";

export const defaultFooterHandles: FooterHandle[] = [];

let cachedRawValue: string | null | undefined;
let cachedFooterHandles: FooterHandle[] = defaultFooterHandles;

export function readStoredFooterHandles() {
  if (typeof window === "undefined") {
    return defaultFooterHandles;
  }

  const storedValue = window.localStorage.getItem(footerHandlesStorageKey);

  if (storedValue === cachedRawValue) {
    return cachedFooterHandles;
  }

  cachedRawValue = storedValue;

  if (!storedValue) {
    cachedFooterHandles = defaultFooterHandles;
    return cachedFooterHandles;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as FooterHandle[];

    if (!Array.isArray(parsedValue)) {
      cachedFooterHandles = defaultFooterHandles;
      return cachedFooterHandles;
    }

    cachedFooterHandles = parsedValue;
    return cachedFooterHandles;
  } catch {
    cachedFooterHandles = defaultFooterHandles;
    return cachedFooterHandles;
  }
}

export function writeStoredFooterHandles(handles: FooterHandle[]) {
  const nextRawValue = JSON.stringify(handles);

  cachedRawValue = nextRawValue;
  cachedFooterHandles = handles;

  window.localStorage.setItem(footerHandlesStorageKey, nextRawValue);
  window.dispatchEvent(new Event("fmc-footer-handles-updated"));
}

export function subscribeToFooterHandles(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("fmc-footer-handles-updated", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("fmc-footer-handles-updated", onStoreChange);
  };
}
