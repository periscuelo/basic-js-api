import { jest } from "@jest/globals";

// ----------------------
// Mocks de Módulos ESM
// ----------------------
const userRepoMock = {
  findUserByEmail: jest.fn(),
};
jest.unstable_mockModule("../repositories/user.repository.js", () => userRepoMock);

const tokenRepoMock = {
  createRefreshToken: jest.fn(),
  findRefreshToken: jest.fn(),
  deleteRefreshToken: jest.fn(),
};
jest.unstable_mockModule("../repositories/refresh-token.repository.js", () => tokenRepoMock);

const cryptoMock = {
  randomUUID: jest.fn(() => "REFRESH_TOKEN"),
};
jest.unstable_mockModule("node:crypto", () => cryptoMock);

const argon2Mock = {
  verify: jest.fn(),
};
jest.unstable_mockModule("argon2", () => argon2Mock);

// ----------------------
// Import dos Módulos Reais Após os Mocks
// ----------------------
const userRepo = await import("../repositories/user.repository.js");
const tokenRepo = await import("../repositories/refresh-token.repository.js");
const crypto = await import("node:crypto");
const argon2 = await import("argon2");
const authController = await import("./auth.controller.js");

// ----------------------
// Setup Teste
// ----------------------
describe("Auth Controller", () => {
  let req;
  let reply;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      cookies: {},
      headers: {},
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
      server: { jwt: { sign: jest.fn(() => "ACCESS_TOKEN") } },
      log: { error: jest.fn() },
    };

    reply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      setCookie: jest.fn(),
      clearCookie: jest.fn(),
    };
  });

  // ----------------------
  // LOGIN TESTS
  // ----------------------
  describe("login", () => {
    it("should return 401 if user not found", async () => {
      userRepoMock.findUserByEmail.mockResolvedValue(null);
      req.body = { email: "test@test.com", password: "pass" };

      await authController.login(req, reply);

      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    it("should return 401 if password is invalid", async () => {
      userRepoMock.findUserByEmail.mockResolvedValue({ id: "1", email: "test@test.com", password: "hash" });
      argon2Mock.verify.mockResolvedValue(false);
      req.body = { email: "test@test.com", password: "wrong" };

      await authController.login(req, reply);

      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    it("should create refresh token and return access token", async () => {
      const user = { id: "1", email: "test@test.com", password: "hash" };
      userRepoMock.findUserByEmail.mockResolvedValue(user);
      argon2Mock.verify.mockResolvedValue(true);
      cryptoMock.randomUUID.mockReturnValue("REFRESH_TOKEN");

      req.body = { email: "test@test.com", password: "pass" };
      await authController.login(req, reply);

      expect(req.server.jwt.sign).toHaveBeenCalledWith(
        { sub: user.id, email: user.email },
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
      );

      expect(tokenRepoMock.createRefreshToken).toHaveBeenCalledWith(expect.objectContaining({
        token: "REFRESH_TOKEN",
        userId: "1",
        userAgent: null,
        ipAddress: "127.0.0.1",
      }));

      expect(reply.setCookie).toHaveBeenCalledWith(
        "refreshToken",
        "REFRESH_TOKEN",
        expect.objectContaining({ httpOnly: true })
      );

      expect(reply.send).toHaveBeenCalledWith({ accessToken: "ACCESS_TOKEN" });
    });

    it("should handle errors with 500", async () => {
      userRepoMock.findUserByEmail.mockRejectedValue(new Error("DB Error"));
      req.body = { email: "test@test.com", password: "pass" };

      await authController.login(req, reply);

      expect(reply.status).toHaveBeenCalledWith(500);
      expect(reply.send).toHaveBeenCalledWith({ error: "Internal server error" });
      expect(req.log.error).toHaveBeenCalled();
    });
  });

  // ----------------------
  // REFRESH TOKEN TESTS
  // ----------------------
  describe("refreshToken", () => {
    it("should return 401 if no refresh token", async () => {
      req.cookies = {};
      await authController.refreshToken(req, reply);

      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({ error: "No refresh token" });
    });

    it("should return 401 if token not found", async () => {
      req.cookies = { refreshToken: "XYZ" };
      tokenRepoMock.findRefreshToken.mockResolvedValue(null);

      await authController.refreshToken(req, reply);

      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({ error: "Invalid refresh token" });
    });

    it("should return 401 if token expired", async () => {
      req.cookies = { refreshToken: "XYZ" };
      const pastDate = new Date(Date.now() - 1000);
      tokenRepoMock.findRefreshToken.mockResolvedValue({ token: "XYZ", userId: "1", expiresAt: pastDate });
      tokenRepoMock.deleteRefreshToken.mockResolvedValue();

      await authController.refreshToken(req, reply);

      expect(tokenRepoMock.deleteRefreshToken).toHaveBeenCalledWith("XYZ");
      expect(reply.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({ error: "Refresh token expired" });
    });

    it("should rotate token and return new access token", async () => {
      req.cookies = { refreshToken: "OLD_TOKEN" };
      const futureDate = new Date(Date.now() + 1000 * 60);
      tokenRepoMock.findRefreshToken.mockResolvedValue({ userId: "1", expiresAt: futureDate });
      tokenRepoMock.deleteRefreshToken.mockResolvedValue();
      tokenRepoMock.createRefreshToken.mockResolvedValue();
      cryptoMock.randomUUID.mockReturnValue("NEW_TOKEN");

      await authController.refreshToken(req, reply);

      expect(tokenRepoMock.deleteRefreshToken).toHaveBeenCalledWith("OLD_TOKEN");
      expect(tokenRepoMock.createRefreshToken).toHaveBeenCalledWith(expect.objectContaining({
        token: "NEW_TOKEN",
        userId: "1",
      }));
      expect(reply.setCookie).toHaveBeenCalledWith("refreshToken", "NEW_TOKEN", expect.any(Object));
      expect(reply.send).toHaveBeenCalledWith({ accessToken: "ACCESS_TOKEN" });
    });
  });

  // ----------------------
  // LOGOUT TESTS
  // ----------------------
  describe("logout", () => {
    it("should delete refresh token if exists", async () => {
      req.cookies = { refreshToken: "XYZ" };
      tokenRepoMock.deleteRefreshToken.mockResolvedValue();

      await authController.logout(req, reply);

      expect(tokenRepoMock.deleteRefreshToken).toHaveBeenCalledWith("XYZ");
      expect(reply.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
      expect(reply.status).toHaveBeenCalledWith(204);
      expect(reply.send).toHaveBeenCalled();
    });

    it("should clear cookie even if no token", async () => {
      req.cookies = {};

      await authController.logout(req, reply);

      expect(tokenRepoMock.deleteRefreshToken).not.toHaveBeenCalled();
      expect(reply.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
      expect(reply.status).toHaveBeenCalledWith(204);
      expect(reply.send).toHaveBeenCalled();
    });
  });
});
