const supportsProto = (() => {
  const base = {},
    sub = Object.create(base);
  try {
    return sub.__proto__ === base;
  } catch (err) {
    // Safety belts.
    // istanbul ignore next: the standard test environment supports __proto__
    return false;
  }
})();

const isObject = (value) => !!value && typeof value === 'object';
const objProto =
  typeof Object.getPrototypeOf === 'function'
    ? Object.getPrototypeOf({})
    : // istanbul ignore next: the standard test environment supports
      // getPrototypeOf
      Object.prototype;

function attemptExfiltrate(getter, proto, exfilProperty) {
  Object.defineProperty(proto, exfilProperty, {
    enumerable: false,
    configurable: true,
    get() {
      return this;
    },
  });
  let value,
    objectHadExfil = false;
  try {
    try {
      value = getter(exfilProperty);
    } catch (err) {
      // Ignore errors.
    }
    // A little spy vs spy?
    objectHadExfil = isObject(value) && exfilProperty in value;
  } finally {
    delete proto[exfilProperty];
  }
  return { valid: objectHadExfil, value };
}

function attemptExfiltratePair(getter, proto) {
  const result = attemptExfiltrate(getter, proto, Symbol());
  if (result.valid) {
    return result;
  }
  // It's possible the getter may be guarding against unexpected parameters like
  // symbols - try a (probably) unique string.
  return attemptExfiltrate(getter, proto, `__exfil${Math.random()}__`);
}

export function exfiltrate(getter) {
  let proto;
  // istanbul ignore else: the standard test environment supports __proto__
  if (supportsProto) {
    try {
      // This could do anything:
      // - throw an error
      // - return undefined
      // - return an unrelated prototype object
      // - report this access attempt to a third party
      proto = getter('__proto__');
    } catch (err) {
      // Ignore errors thrown by getter to warn against __proto__ access.
    }
    if (!isObject(proto)) proto = void 0;
  }
  if (proto !== void 0) {
    const { valid, value } = attemptExfiltratePair(getter, proto);
    if (valid) {
      return value;
    }
    // Otherwise, fall through and attempt to use Object.prototype.
  }
  // If we can't get the prototype of the private object itself, attempt to
  // exfiltrate via shared global object prototype.
  const { valid, value } = attemptExfiltratePair(getter, objProto);
  if (valid) {
    return value;
  }
  throw new Error('not vulnerable to exfiltration');
}
