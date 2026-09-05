// A minimal stand-in for a Mongoose Query. Mongoose queries are
// "thenable" (awaitable directly) and also support chained calls like
// .populate()/.select()/.sort()/.lean() that return the query itself.
// This proxy mimics both behaviors so controller code can be tested
// without a real MongoDB connection: any chained method call just
// returns the same proxy, and awaiting the proxy resolves to `result`.
export function fakeQuery(result) {
  const handler = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve, reject) => Promise.resolve(result).then(resolve, reject);
      }
      if (prop === 'catch') {
        return (reject) => Promise.resolve(result).catch(reject);
      }
      if (prop === 'finally') {
        return (fn) => Promise.resolve(result).finally(fn);
      }
      // Any other property access (populate, select, sort, limit, lean...)
      // is treated as a chainable method call.
      return () => proxy;
    }
  };
  const proxy = new Proxy({}, handler);
  return proxy;
}
