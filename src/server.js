import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import registerRoutes from "./resources/routes/index.js";
import "./env.js";

const fastify = Fastify({ logger: true });

/* JWT */
if (!process.env.JWT_SECRET) {
  console.error("Error: JWT_SECRET is not defined in .env file");
  process.exit(1);
}

fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET,
});

/* Cookies */
if (!process.env.COOKIE_SECRET) {
  console.error("Error: COOKIE_SECRET is not defined in .env file");
  process.exit(1);
}

fastify.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET,
});

/* CORS */
if (!process.env.FRONTEND_URL) {
  console.error("Error: FRONTEND_URL is not defined in .env file");
  process.exit(1);
}

fastify.register(fastifyCors, {
  origin: process.env.FRONTEND_URL.split(","),
  credentials: true,
});

fastify.decorate("authenticate", async (req, reply) => {
  try {
    await req.jwtVerify();
  } catch {
    reply.code(401).send({ error: "Unauthorized" });
  }
});

/* Swagger/OpenAPI */
await fastify.register(swagger, {
  openapi: {
    info: {
      title: "Brazilian Pastries API",
      description: "API documentation",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
});

await fastify.register(swaggerUI, {
  routePrefix: "/docs",
  exposeRoute: true,
  uiConfig: {
    withCredentials: true,
  }
});

/* Routes */
await registerRoutes(fastify);

/* Health check */
fastify.get("/", async () => ({ status: "UP", timestamp: new Date().toISOString() }));

const start = async () => {
  try {
    await fastify.listen({
      port: process.env.PORT || 3000,
      host: "0.0.0.0",
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export default fastify;
