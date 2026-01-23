import dotenv from "dotenv";

const envFileMap = {
  production: ".env.production",
  development: ".env.development",
  test: ".env.test",
};

const envFile = envFileMap[process.env.NODE_ENV] || ".env.development";

dotenv.config({ path: envFile });
