import { useState, useMemo, useEffect } from "react";

export { HaltiaMap, HaltiaSet } from "./main.js";

export const useHaltia = (mapOrSet) => {
  const [, setState] = useState(mapOrSet);
  const subscription = useMemo(() => mapOrSet.subscribe(setState), [mapOrSet]);
  useEffect(() => () => subscription.unsubscribe(), [subscription]);
  return subscription;
};
