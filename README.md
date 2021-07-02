# Haltia

Experimental state manager. Extends `Map` and `Set`, making them reactive.

```js
import { HaltiaMap, HaltiaSet } from "./main.js";

// These work just like native JS Map and Set
const state = new HaltiaMap({ number: 0 });
const list = new HaltiaSet();

// Except you can subscribe to them!
state.subscribe((state) => {
  // Whenever you use .get, .has, or .size here, Haltia keeps track of it,
  // and will re-run this function if any it changes in the future.
  console.log(state.get("number"));
  console.log(state.has("blargh"));
  console.log(state.size);

  // You can manipulate any Maps and Sets here freely. Changes will take effect immediately,
  // BUT any functions subscribed to them won't be called immediately.
  // Instead they'll be called on the next requestIdleCallback (or requestAnimationFrame).
  // This is so you can do multiple manipulations in a row, before your functions trigger.
  list.add(state.get("number"));
  list.delete(state.get("number"));
  list.add(state.get("number"));
  state.set("something", "else");
});

// You can also subscribe to a Set. It otherwise works the same as the Map above,
// but there's no fancy usage tracking.
// Your function will simply be called whenever something gets added or deleted.
list.subscribe((list) => console.log([...list].join(", ")));

// You can also use the "subscription" outside your function, which is useful for React.
export const useHaltia = (haltiaMapOrSet) => {
  const [, setState] = useState(haltiaMapOrSet);
  const subscription = useMemo(() => haltiaMapOrSet.subscribe(setState), [haltiaMapOrSet]);
  useEffect(() => () => subscription.unsubscribe(), [subscription]);
  return subscription;
};

const stateSubscription = useHaltia(state);
stateSubscription.get("number"); // your hook will now re-render whenever `number` changes
```

## Contributors

- https://twitter.com/jonikorpi/
- https://twitter.com/VirtanenS (library name)
