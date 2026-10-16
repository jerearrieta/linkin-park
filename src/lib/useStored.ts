"use client";

import { useEffect, useState } from "react";
import { onStorageChange } from "./storage";

/** Reads a value from browser storage after mount and keeps it in sync with later changes. */
export function useStored<T>(readFn: () => T, deps: unknown[] = []): T | undefined {
  const [value, setValue] = useState<T>();
  useEffect(() => {
    setValue(readFn());
    return onStorageChange(() => setValue(readFn()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}
