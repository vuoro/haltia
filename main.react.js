import { useState, useMemo, useEffect } from "react";

export { ReactiveMap, ReactiveSet } from "./main.js";

export const useSubscription = (mapOrSet) => {
  const [, setState] = useState(mapOrSet);
  const subscription = useMemo(() => mapOrSet.subscribe(setState), [mapOrSet]);
  useEffect(() => () => subscription.unsubscribe(), [subscription]);
  return subscription;
};
