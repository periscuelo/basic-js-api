import Fastify from "fastify";
import { jest } from "@jest/globals";

// Mock Controllers
jest.mock("../../controllers/auth.controller.js", () => ({
  __esModule: true,
  login: jest.fn().mockResolvedValue(),
  refreshToken: jest.fn().mockResolvedValue(),
  logout: jest.fn().mockResolvedValue(),
}));

import authRoutes from "../auth.routes.js";
import * as authController from "../../controllers/auth.controller.js";

describe("Auth Routes", () => {
  let fastify;

  beforeEach(async () => {
    fastify = Fastify({ logger: false });
    jest.clearAllMocks();
    await authRoutes(fastify);
  });

  afterEach(async () => {
    if (fastify) await fastify.close();
  });

  it("should register POST /auth/login", async () => {
    await fastify.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "a@b.com", password: "123" },
    });

    expect(authController.login).toHaveBeenCalled();
  });

  it("should register POST /auth/refresh", async () => {
    await fastify.inject({
      method: "POST",
      url: "/auth/refresh",
    });

    expect(authController.refreshToken).toHaveBeenCalled();
  });

  it("should register POST /auth/logout", async () => {
    await fastify.inject({
      method: "POST",
      url: "/auth/logout",
    });

    expect(authController.logout).toHaveBeenCalled();
  });
});
