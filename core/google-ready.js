export function waitForGoogle({ timeout = 15000 } = {}) {
  if (globalThis.google?.accounts) return Promise.resolve(globalThis.google);
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const check = () => { if (globalThis.google?.accounts) return resolve(globalThis.google); if (Date.now() - started >= timeout) return reject(new Error("Google Identity Services load timeout")); setTimeout(check, 50); };
    check();
  });
}
