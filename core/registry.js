export class ModuleRegistry {
  #modules = new Map();
  #context;
  constructor(context = {}) { this.#context = context; }
  register(module) {
    if (!module?.id || typeof module.call !== "function") throw new Error("Invalid module contract");
    if (this.#modules.has(module.id)) throw new Error(`Module already registered: ${module.id}`);
    this.#modules.set(module.id, module);
    return module;
  }
  get(id) { return this.#modules.get(id); }
  list() { return [...this.#modules.values()]; }
  async initializeAll() {
    const results = await Promise.allSettled(this.list().map(async module => {
      await module.initialize(this.#context);
      return module;
    }));
    return results.map((result, index) => ({ module: this.list()[index].id, ...result }));
  }
  async call(id, action, ...args) {
    const module = this.get(id);
    if (!module) throw new Error(`Module not found: ${id}`);
    if (!module.ready) throw new Error(`Module not ready: ${id}`);
    return module.call(action, ...args);
  }
}
