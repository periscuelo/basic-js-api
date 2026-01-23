import { jest } from "@jest/globals";
import Fastify from "fastify";

// Mock completo do módulo de controllers
const authControllerMock = {
  login: jest.fn().mockResolvedValue(),
  refreshToken: jest.fn().mockResolvedValue(),
  logout: jest.fn().mockResolvedValue(),
};

// Mocka o módulo ESM
jest.unstable_mockModule("../controllers/auth.controller.js", () => authControllerMock);

// Importa o módulo de rotas **depois** de aplicar o mock
const authRoutes = (await import("./auth.routes.js")).default;

describe("Auth Routes", () => {
  let fastify;

  beforeEach(async () => {
    fastify = Fastify({ logger: false });

    // Limpa mocks antes de cada teste
    authControllerMock.login.mockClear();
    authControllerMock.refreshToken.mockClear();
    authControllerMock.logout.mockClear();

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
    expect(authControllerMock.login).toHaveBeenCalled();
  });

  it("should register POST /auth/refresh", async () => {
    await fastify.inject({
      method: "POST",
      url: "/auth/refresh",
    });
    expect(authControllerMock.refreshToken).toHaveBeenCalled();
  });

  it("should register POST /auth/logout", async () => {
    await fastify.inject({
      method: "POST",
      url: "/auth/logout",
    });
    expect(authControllerMock.logout).toHaveBeenCalled();
  });
});
