import { jest } from "@jest/globals";

// ----------------------
// Mock do Prisma
// ----------------------
jest.mock("../../../lib/prisma.js", () => {
  const refreshToken = {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  };

  return {
    prisma: {
      refreshToken,
    },
    __esModule: true,
  };
});

// Imports after mock
import { prisma } from "../../../lib/prisma.js";
import * as repo from "../refresh-token.repository.js";

// ----------------------
// Testes
// ----------------------
describe("Refresh Token Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------
  // CREATE
  // ----------------------
  describe("createRefreshToken", () => {
    it("should create a new refresh token", async () => {
      const data = { token: "ABC", userId: "1", expiresAt: new Date() };
      prisma.refreshToken.create.mockResolvedValue(data);

      const result = await repo.createRefreshToken(data);

      expect(prisma.refreshToken.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(data);
    });
  });

  // ----------------------
  // FIND
  // ----------------------
  describe("findRefreshToken", () => {
    it("should find a refresh token by token", async () => {
      const token = "ABC";
      const tokenData = { token: "ABC", userId: "1" };
      prisma.refreshToken.findUnique.mockResolvedValue(tokenData);

      const result = await repo.findRefreshToken(token);

      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({ where: { token } });
      expect(result).toEqual(tokenData);
    });

    it("should return null if token not found", async () => {
      const token = "XYZ";
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      const result = await repo.findRefreshToken(token);

      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({ where: { token } });
      expect(result).toBeNull();
    });
  });

  // ----------------------
  // DELETE
  // ----------------------
  describe("deleteRefreshToken", () => {
    it("should delete a refresh token", async () => {
      const token = "ABC";
      const deleted = { token: "ABC", userId: "1" };
      prisma.refreshToken.delete.mockResolvedValue(deleted);

      const result = await repo.deleteRefreshToken(token);

      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { token } });
      expect(result).toEqual(deleted);
    });

    it("should throw error if delete fails", async () => {
      const token = "XYZ";
      prisma.refreshToken.delete.mockRejectedValue(new Error("Delete Error"));

      await expect(repo.deleteRefreshToken(token)).rejects.toThrow("Delete Error");
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { token } });
    });
  });
});
