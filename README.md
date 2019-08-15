# proto-exfil

A tool to attempt to exfiltrate an entire object given only an insecure getter
for that object.

Uses a bunch of tricks, including overwriting the global Object prototype in the
worst case, first using a unique `Symbol` (to avoid collisions as much as
possible), then using a randomly generated string (again, collisions). Performs
best-attempt cleanup to avoid interfering with other systems.

```js
// some private object, which inherits from Object.
const privateObject = {};

// a bog-standard insecure getter, as might be exposed on some public interface.
const insecureGetter = (key) => privateObject[key];

import { exfiltrate } from 'proto-exfil';

// Exfiltrates the privateObject using only the insecureGetter via Magic™.
const exfilObject = exfiltrate(insecureGetter);

// Handles a bunch of other common cases - the getter is only as secure as the
// private object's prototype. See the tests for more examples.
function insecureGetter(key) {
  // This isn't enough to protect against object exfiltration.
  if (key === '__proto__') {
    throw new Error('prototype access denied');
  }
  return privateObject[key];
}
```

While this is a PoC that could be theoretically used for exploits, it also has
(some) value in helping manipulate uncooperative third-party libraries for
advanced instrumentation and analysis (hi, jQuery).

## License

MIT.
