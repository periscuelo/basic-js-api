import { jest } from "@jest/globals";

// ----------------------
// Mocks
// ----------------------
jest.mock("../../repositories/user.repository.js", () => ({
  findUserByEmail: jest.fn(),
}));

jest.mock("../../repositories/refresh-token.repository.js", () => ({
  createRefreshToken: jest.fn(),
  findRefreshToken: jest.fn(),
  deleteRefreshToken: jest.fn(),
}));

jest.mock("node:crypto", () => ({
  randomUUID: jest.fn(() => "REFRESH_TOKEN"),
}));

jest.mock("argon2", () => ({
  verify: jest.fn(),
}));

// ----------------------
//  Import modules after applying mocks to ensure controller uses mocked dependencies
// ----------------------
let userRepo;
let tokenRepo;
let crypto;
let argon2;
let authController;

beforeAll(async () => {
  userRepo = await import("../../repositories/user.repository.js");
  tokenRepo = await import("../../repositories/refresh-token.repository.js");
  crypto = await import("node:crypto");
  argon2 = await import("argon2");
  authController = await import("../auth.controller.js");
});

// ----------------------
// Setup Test
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
      userRepo.findUserByEmail.mockResolvedValue(null);
      req.body = { email: "test@test.com", password: "pass" };

      await authController.login(req, reply);

      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    it("should return 401 if password is invalid", async () => {
      userRepo.findUserByEmail.mockResolvedValue({ id: "1", email: "test@test.com", password: "hash" });
      argon2.verify.mockResolvedValue(false);
      req.body = { email: "test@test.com", password: "wrong" };

      await authController.login(req, reply);

      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    it("should create refresh token and return access token", async () => {
      const user = { id: "1", email: "test@test.com", password: "hash" };
      userRepo.findUserByEmail.mockResolvedValue(user);
      argon2.verify.mockResolvedValue(true);
      crypto.randomUUID.mockReturnValue("REFRESH_TOKEN");

      req.body = { email: "test@test.com", password: "pass" };
      await authController.login(req, reply);

      expect(req.server.jwt.sign).toHaveBeenCalledWith(
        { sub: user.id, email: user.email },
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
      );

      expect(tokenRepo.createRefreshToken).toHaveBeenCalledWith(expect.objectContaining({
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
      userRepo.findUserByEmail.mockRejectedValue(new Error("DB Error"));
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
      tokenRepo.findRefreshToken.mockResolvedValue(null);

      await authController.refreshToken(req, reply);

      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({ error: "Invalid refresh token" });
    });

    it("should return 401 if token expired", async () => {
      req.cookies = { refreshToken: "XYZ" };
      const pastDate = new Date(Date.now() - 1000);
      tokenRepo.findRefreshToken.mockResolvedValue({ token: "XYZ", userId: "1", expiresAt: pastDate });
      tokenRepo.deleteRefreshToken.mockResolvedValue();

      await authController.refreshToken(req, reply);

      expect(tokenRepo.deleteRefreshToken).toHaveBeenCalledWith("XYZ");
      expect(reply.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({ error: "Refresh token expired" });
    });

    it("should rotate token and return new access token", async () => {
      req.cookies = { refreshToken: "OLD_TOKEN" };
      const futureDate = new Date(Date.now() + 1000 * 60);
      tokenRepo.findRefreshToken.mockResolvedValue({ userId: "1", expiresAt: futureDate });
      tokenRepo.deleteRefreshToken.mockResolvedValue();
      tokenRepo.createRefreshToken.mockResolvedValue();
      crypto.randomUUID.mockReturnValue("NEW_TOKEN");

      await authController.refreshToken(req, reply);

      expect(tokenRepo.deleteRefreshToken).toHaveBeenCalledWith("OLD_TOKEN");
      expect(tokenRepo.createRefreshToken).toHaveBeenCalledWith(expect.objectContaining({
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
      tokenRepo.deleteRefreshToken.mockResolvedValue();

      await authController.logout(req, reply);

      expect(tokenRepo.deleteRefreshToken).toHaveBeenCalledWith("XYZ");
      expect(reply.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
      expect(reply.status).toHaveBeenCalledWith(204);
      expect(reply.send).toHaveBeenCalled();
    });

    it("should clear cookie even if no token", async () => {
      req.cookies = {};

      await authController.logout(req, reply);

      expect(tokenRepo.deleteRefreshToken).not.toHaveBeenCalled();
      expect(reply.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
      expect(reply.status).toHaveBeenCalledWith(204);
      expect(reply.send).toHaveBeenCalled();
    });
  });
});
