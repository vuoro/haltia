import { useState, useMemo, useEffect } from "react";

export { Map, Set } from "./main.js";

export const useHaltia = (mapOrSet) => {
  const [, setState] = useState(mapOrSet);
  const subscription = useMemo(() => mapOrSet.subscribe(setState), [mapOrSet]);
  useEffect(() => () => subscription.unsubscribe(setState), [subscription]);
  return subscription;
};
