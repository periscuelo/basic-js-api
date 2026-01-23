import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const registerRoutes = async (fastify, dir = __dirname) => {
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
      throw new Error(`Arquivo ${entry.name} não exporta função padrão`);
    }

    await register(fastify);
  }
};

export default registerRoutes;
