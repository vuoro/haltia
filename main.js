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
    callback();
  }
  requests.clear();
  current = null;
};

export class Map extends NativeMap {
  constructor(input) {
    const seemsIterable = input != null && typeof input[Symbol.iterator] === "function";
    const maybeAnObject = typeof input === "object";
    super(seemsIterable ? input : maybeAnObject ? Object.entries(input) : input);
  }

  set(key, value) {
    super.set(key, value);
    this.changedKeys?.add(key);
    request(this.callSubs);
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
    const actualThis = this;

    const subscription = {
      get size() {
        actualThis.sizeSubs.add(sub);
        return actualThis.size;
      },
      get: (key) => {
        if (!actualThis.subMap.has(key)) actualThis.subMap.set(key, new NativeSet());
        actualThis.subMap.get(key).add(sub);
        return actualThis.get(key);
      },
      has: (key) => {
        if (!actualThis.subMap.has(key)) actualThis.subMap.set(key, new NativeSet());
        actualThis.subMap.get(key).add(sub);
        return actualThis.has(key);
      },
      set: (key, value) => actualThis.set(key, value),
      delete: (key) => actualThis.delete(key),
      clear: () => actualThis.clear(),
      unsubscribe: () => {
        for (const [, subs] of actualThis.subMap) {
          subs.delete(sub);
        }
        actualThis.sizeSubs.delete(sub);
      },
      [Symbol.iterator]: () => actualThis[Symbol.iterator](),
      keys: () => actualThis.keys(),
      values: () => actualThis.values(),
      entries: () => actualThis.entries(),
      forEach: (callback, thisArg) => actualThis.forEach(callback, thisArg),
    };

    this.subscriptions.set(sub, subscription);

    sub(subscription);

    return subscription;
  }

  callSubs = () => {
    for (const key of this.changedKeys) {
      const subs = this.subMap.get(key);
      if (subs) {
        for (const sub of subs) {
          this.queue.add(sub);
        }
      }
    }

    for (const sub of this.sizeSubs) {
      this.queue.add(sub);
    }

    for (const sub of this.queue) {
      sub(this.subscriptions.get(sub));
    }

    this.changedKeys.clear();
    this.queue.clear();
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
