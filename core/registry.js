export class ModuleRegistry {
  #modules = new Map();
  #context;
  constructor(context = {}) { this.#context = context; }
  register(module) {
    if (!module?.id || typeof module.call !== "function" || typeof module.initialize !== "function") throw new Error("Invalid module contract");
    if (this.#modules.has(module.id)) throw new Error(`Module already registered: ${module.id}`);
    this.#modules.set(module.id, module);
    return this;
  }
  get(id) { return this.#modules.get(id); }
  list() { return [...this.#modules.values()]; }
  async initializeAll() {
    const modules = this.list();
    const results = await Promise.allSettled(modules.map(module => module.initialize(this.#context)));
    return results.map((result, index) => ({ module: modules[index].id, ...result }));
  }
  async isReady(id) { const module = this.get(id); return Boolean(module && await module.ready); }
  async call(id, action, ...args) {
    const module = this.get(id);
    if (!module) throw new Error(`Module not found: ${id}`);
    const lifecycle = module.lifecycle?.[action] || "ready";
    if (lifecycle !== "before-ready" && !(await module.ready)) throw new Error(`Module not ready: ${id}`);
    return module.call(action, ...args);
  }
}
