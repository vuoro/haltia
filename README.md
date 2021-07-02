Experimental state manager. Extends `Map` and `Set`, making them reactive.

```js
import { HaltiaMap, HaltiaSet } from "./main.js";

// These work just like native JS Map and Set
const state = new HaltiaMap({ number: 0 });
const list = new HaltiaSet();

// Except you can subscribe to them!
state.subscribe((state) => {
  // Whenever you use state.get here, Haltia keeps track of what key you accessed,
  // and will re-run this function if its value changes in the future.
  console.log(state.get("number"));

  // state here is just a proxy for the original state, so you can use it as per normal
  state.set("something", "else");

  // You can manipulate other Maps and Sets here freely. Changes will take effect immediately,
  // BUT any functions subscribed to them won't be called immediately.
  // Instead they'll be called on the next requestIdleCallback (or requestAnimationFrame).
  // This is so you can do multiple manipulations in a row, before your functions trigger.
  list.add(state.get("number"));
  list.delete(state.get("number"));
  list.add(state.get("number"));
});

// You can also subscribe to a Set. It otherwise works the same as the Map above,
// but there's no fancy usage tracking.
// Your function will simply be called whenever something gets added or deleted.
list.subscribe((list) => console.log([...list].join(", ")));

// You can also use the subscription outside your function, which is useful for React.
export const useHaltia = (haltiaMapOrSet) => {
  const [, setState] = useState(haltiaMapOrSet);
  const subscription = useMemo(() => haltiaMapOrSet.subscribe(setState), [haltiaMapOrSet]);
  useEffect(() => () => subscription.unsubscribe(), [subscription]);
  return subscription;
};

const stateSubscription = useHaltia(state);
stateSubscription.get("number"); // your useHaltia hook will now re-render whenever `number` changes
```
