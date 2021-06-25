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
  subs = new Set();
  callSubs = () => {
    for (const subscriber of this.subs) {
      subscriber(this);
    }
  };

  constructor(input) {
    const seemsIterable = input != null && typeof input[Symbol.iterator] === "function";
    const maybeAnObject = typeof input === "object";
    super(seemsIterable ? input : maybeAnObject ? Object.entries(input) : input);
  }

  set(key, input, immediate) {
    super.set(key, input);
    if (immediate) {
      this.callSubs();
    } else {
      request(this.callSubs);
    }
  }
  delete(input, immediate) {
    super.delete(input);
    if (immediate) {
      this.callSubs();
    } else {
      request(this.callSubs);
    }
  }
  clear(immediate) {
    super.clear();
    if (immediate) {
      this.callSubs();
    } else {
      request(this.callSubs);
    }
  }

  subscribe(input) {
    this.subs.add(input);
  }
  unsubscribe(input) {
    this.subs.delete(input);
  }
}

export class ReactiveSet extends Set {
  subs = new Set();
  callSubs = () => {
    for (const subscriber of this.subs) {
      subscriber(this);
    }
  };

  add(input, immediate) {
    super.add(input);
    if (immediate) {
      this.callSubs();
    } else {
      request(this.callSubs);
    }
  }
  delete(input, immediate) {
    super.delete(input);
    if (immediate) {
      this.callSubs();
    } else {
      request(this.callSubs);
    }
  }
  clear(immediate) {
    super.clear();
    if (immediate) {
      this.callSubs();
    } else {
      request(this.callSubs);
    }
  }

  subscribe(input, keys) {
    this.subs.add(input);
  }
  unsubscribe(input) {
    this.subs.delete(input);
  }
}
