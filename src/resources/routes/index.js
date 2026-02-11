import path from "node:path";
import { readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const registerRoutes = async (fastify, dir) => {
  const entries = await readdir(dir, { withFileTypes: true });

  const sortedEntries = entries.toSorted((a, b) =>
    a.name.localeCompare(b.name)
  );

  for (const entry of sortedEntries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await registerRoutes(fastify, fullPath);
      continue;
    }

    if (!entry.name.endsWith(".routes.js")) continue;

    const moduleUrl = pathToFileURL(fullPath).href;
    const mod = await import(moduleUrl);

    const register = mod.default ?? mod;
    if (typeof register !== "function") {
      throw new TypeError(`Arquivo ${entry.name} não exporta função padrão`);
    }

    await register(fastify);
  }
};

export default registerRoutes;
