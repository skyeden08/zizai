export function createModule({ id, capabilities = [], initialize, actions = {}, ready = () => true, lifecycle = {} }) {
  if (!id) throw new Error("Module id is required");
  const actionNames = new Set(Object.keys(actions));
  const beforeReady = new Set(lifecycle.beforeReady || []);
  let module;
  const lifecycleMap = Object.freeze(Object.fromEntries(
    [...actionNames].map(action => [action, beforeReady.has(action) ? "before-ready" : "ready"])
  ));
  module = Object.freeze({
    id,
    capabilities: Object.freeze([...capabilities]),
    lifecycle: lifecycleMap,
    get ready() {
      const value = ready();
      if (value && typeof value.then === "function") return value.then(Boolean);
      return Boolean(value);
    },
    initialize: initialize || (async () => {}),
    async call(action, ...args) {
      if (!actionNames.has(action)) throw new Error(`Unsupported action: ${id}.${action}`);
      try { return await actions[action](...args); }
      catch (error) { throw new Error(`[${id}.${action}] ${error.message || error}`, { cause: error }); }
    },
    has(action) { return actionNames.has(action); }
  });
  return module;
}
