export function createModule({ id, capabilities = [], initialize, actions = {}, ready = () => true }) {
  if (!id) throw new Error("Module id is required");
  const actionNames = new Set(Object.keys(actions));
  return Object.freeze({
    id,
    capabilities: Object.freeze([...capabilities]),
    get ready() { return Promise.resolve().then(() => ready()); },
    initialize: initialize || (async () => {}),
    async call(action, ...args) {
      if (!actionNames.has(action)) throw new Error(`Unsupported action: ${id}.${action}`);
      try { return await actions[action](...args); }
      catch (error) { throw new Error(`[${id}.${action}] ${error.message || error}`, { cause: error }); }
    },
    has(action) { return actionNames.has(action); }
  });
}
