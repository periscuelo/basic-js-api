import {
  login,
  logout,
  refreshToken
} from "../controllers/auth.controller.js";
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema
} from "../schemas/auth.schema.js";

const authRoutes = async (fastify) => {
  fastify.register(async (instance) => {
      instance.post("/login", { schema: loginSchema }, login);
      instance.post("/refresh", { schema: refreshTokenSchema }, refreshToken);
      instance.post("/logout", { schema: logoutSchema }, logout);
    }, { prefix: "/auth" });
};

export default authRoutes;
