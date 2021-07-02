const requestFunction = window.requestIdleCallback || window.requestAnimationFrame;
const requests = new Set();
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

export class ReactiveMap extends Map {
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

  subMap = new Map();
  sizeSubs = new Set();
  changedKeys = new Set();
  queue = new Set();
  subscriptions = new Map();

  subscribe(sub) {
    const actualThis = this;

    const subscription = {
      get size() {
        actualThis.sizeSubs.add(sub);
        return actualThis.size;
      },
      get: (key) => {
        if (!actualThis.subMap.has(key)) actualThis.subMap.set(key, new Set());
        actualThis.subMap.get(key).add(sub);
        return actualThis.get(key);
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
    };

    this.subscriptions.set(sub, subscription);

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

export class ReactiveSet extends Set {
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

  subs = new Set();
  callSubs = () => {
    for (const subscriber of this.subs) {
      subscriber(this);
    }
  };

  subscribe(sub) {
    this.subs.add(sub);
    return this;
  }
  unsubscribe(sub) {
    this.subs.delete(sub);
  }
}
