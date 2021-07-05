import { useState, useMemo, useEffect } from "react";

export const useHaltia = (mapOrSet) => {
  const [, setState] = useState(mapOrSet);
  const identity = useMemo(() => () => setState((v) => v + 1), []);
  const subscription = useMemo(() => mapOrSet.subscribe(identity), [mapOrSet, identity]);
  useEffect(() => () => subscription.unsubscribe(identity), [subscription, identity]);
  return subscription;
};
