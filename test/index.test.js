import { exfiltrate } from '..';

const base = {
  hello: 'world',
};

describe('exfiltrate', () => {
  it('should exfiltrate from simple objects', () => {
    const obj = { ...base };
    const getter = (key) => obj[key];

    expect(getter('hello')).toBe('world');
    expect(exfiltrate(getter)).toBe(obj);
  });

  it('should exfiltrate from custom objects', () => {
    class Obj {}
    const obj = new Obj();
    Object.assign(obj, base);
    const getter = (key) => obj[key];

    expect(getter('hello')).toBe('world');
    expect(exfiltrate(getter)).toBe(obj);
  });

  it('should not exfiltrate from free objects', () => {
    const obj = Object.create(null);
    Object.assign(obj, base);
    const getter = (key) => obj[key];

    expect(obj.__proto__).toBe(undefined);

    expect(getter('hello')).toBe('world');
    expect(() => exfiltrate(getter)).toThrow('not vulnerable');
  });

  it('should not exfiltrate from free custom objects', () => {
    const freeBase = Object.create(null),
      obj = Object.create(freeBase);
    Object.assign(obj, base);
    const getter = (key) => obj[key];

    expect(obj.__proto__).toBe(undefined);

    expect(getter('hello')).toBe('world');
    expect(() => exfiltrate(getter)).toThrow('not vulnerable');
  });

  it('should exfiltrate from guarded objects', () => {
    const obj = { ...base };
    function getter(key) {
      // Uh-oh! We better block this access.
      if (key === '__proto__') {
        throw new Error('not permitted');
      }
      return obj[key];
    }

    expect(getter('hello')).toBe('world');
    expect(exfiltrate(getter)).toBe(obj);
  });

  it('should exfiltrate from string-bound object getters', () => {
    const obj = { ...base };
    function getter(key) {
      // Uh-oh! We better block this access.
      if (typeof key !== 'string') {
        throw new TypeError('expected string');
      }
      return obj[key];
    }

    expect(getter('hello')).toBe('world');
    expect(exfiltrate(getter)).toBe(obj);
  });

  it('should exfiltrate from misleading getters', () => {
    class Obj {}
    const obj = new Obj();
    Object.assign(obj, base);
    function getter(key) {
      // Return some unrelated object to mislead.
      if (key === '__proto__') {
        return Object.create({});
      }
      return obj[key];
    }

    expect(getter('hello')).toBe('world');
    expect(exfiltrate(getter)).toBe(obj);
  });

  it('should exfiltrate from incorrectly guarded getters', () => {
    const obj = { ...base };
    function getter(key) {
      if (key in obj) {
        return obj[key];
      }
      throw new Error('no such key');
    }

    expect(getter('hello')).toBe('world');
    expect(exfiltrate(getter)).toBe(obj);
  });
});
