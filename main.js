const NativeMap = window.Map;
const NativeSet = window.Set;

const requestFunction = window.requestIdleCallback || window.requestAnimationFrame;
const requests = new NativeSet();
let current = null;
const request = (input) => {
  if (input) {
    requests.add(input);
    current = current || requestFunction(performRequest);
  }
};
const performRequest = () => {
  for (const callback of requests) {
    requests.delete(callback);
    callback();
  }
  current = null;
};

export class Map extends NativeMap {
  constructor(input) {
    const seemsIterable = input != null && typeof input[Symbol.iterator] === "function";
    const maybeAnObject = typeof input === "object";
    super(seemsIterable ? input : maybeAnObject ? Object.entries(input) : input);
  }

  set(key, value, forceUpdate = false) {
    const valueMatches = this.get(key) === value;
    super.set(key, value);

    if (!valueMatches || forceUpdate) {
      this.changedKeys?.add(key);
      request(this.callSubs);
    }
  }
  delete(key) {
    if (this.has(key)) {
      super.delete(key);
      this.changedKeys?.add(key);
      request(this.callSubs);
    }
  }
  clear() {
    if (this.size > 0) {
      super.clear();
      for (const key of this.keys()) {
        this.changedKeys.add(key);
      }
      request(this.callSubs);
    }
  }

  subMap = new NativeMap();
  sizeSubs = new NativeSet();
  changedKeys = new NativeSet();
  queue = new NativeSet();
  subscriptions = new NativeMap();

  subscribe(sub) {
    const map = this;
    const { subMap, sizeSubs, subscriptions } = map;

    const subscription = {
      get size() {
        map.sizeSubs.add(sub);
        return map.size;
      },
      get: (key) => {
        if (!subMap.has(key)) subMap.set(key, new NativeSet());
        subMap.get(key).add(sub);
        return map.get(key);
      },
      has: (key) => {
        if (!subMap.has(key)) subMap.set(key, new NativeSet());
        subMap.get(key).add(sub);
        return map.has(key);
      },
      set: (key, value) => map.set(key, value),
      delete: (key) => map.delete(key),
      clear: () => map.clear(),
      unsubscribe: () => {
        for (const [, subs] of subMap) {
          subs.delete(sub);
        }
        sizeSubs.delete(sub);
        subscriptions.delete(sub);
      },
      [Symbol.iterator]: () => map[Symbol.iterator](),
      keys: () => map.keys(),
      values: () => map.values(),
      entries: () => map.entries(),
      forEach: (callback, thisArg) => map.forEach(callback, thisArg),
    };

    subscriptions.set(sub, subscription);
    sub(subscription);

    return subscription;
  }

  callSubs = () => {
    const { changedKeys, subMap, sizeSubs, queue, subscriptions } = this;

    for (const key of changedKeys) {
      const subs = subMap.get(key);
      changedKeys.delete(key);
      if (subs) {
        for (const sub of subs) {
          queue.add(sub);
        }
      }
    }

    for (const sub of sizeSubs) {
      queue.add(sub);
    }

    for (const sub of queue) {
      queue.delete(sub);
      sub(subscriptions.get(sub));
    }
  };
}

export class Set extends NativeSet {
  add(value) {
    if (!this.has(value)) {
      super.add(value);
      request(this.callSubs);
    }
  }
  delete(value) {
    if (this.has(value)) {
      super.delete(value);
      request(this.callSubs);
    }
  }
  clear() {
    if (this.size > 0) {
      super.clear();
      request(this.callSubs);
    }
  }

  subs = new NativeSet();
  callSubs = () => {
    for (const subscriber of this.subs) {
      subscriber(this);
    }
  };

  subscribe(sub) {
    this.subs.add(sub);
    sub(this);
    return this;
  }
  unsubscribe(sub) {
    this.subs.delete(sub);
  }
}
