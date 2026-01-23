import fs from "node:fs/promises";
import path from "node:path";
import JavaScriptObfuscator from "javascript-obfuscator";

const srcDir = "src";
const outDir = "dist";

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const e of entries) {
    const srcPath = path.join(dir, e.name);
    const outPath = path.join(outDir, path.relative(srcDir, srcPath));

    if (e.isDirectory()) {
      await fs.mkdir(outPath, { recursive: true });
      await walk(srcPath);
      continue;
    }

    if (!e.name.endsWith(".js")) {
      await fs.copyFile(srcPath, outPath);
      continue;
    }

    const code = await fs.readFile(srcPath, "utf8");
    const obfuscated = JavaScriptObfuscator.obfuscate(code, {
      compact: true,
      controlFlowFlattening: true,
      deadCodeInjection: true,
      stringArray: true,
      stringArrayEncoding: ["base64"],
      renameGlobals: false,
    }).getObfuscatedCode();

    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, obfuscated);
  }
};

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir);
await walk(srcDir);

console.log("✅ Código ofuscado em /dist");
