import { jest } from "@jest/globals";

// ----------------------
// Mock do Prisma
// ----------------------
const prismaMock = {
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
};

// Sobrescreve a importação do prisma no módulo
jest.unstable_mockModule("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

// Importa o repository após o mock
const repo = await import("./refresh-token.repository.js");

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
      prismaMock.refreshToken.create.mockResolvedValue(data);

      const result = await repo.createRefreshToken(data);

      expect(prismaMock.refreshToken.create).toHaveBeenCalledWith({ data });
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
      prismaMock.refreshToken.findUnique.mockResolvedValue(tokenData);

      const result = await repo.findRefreshToken(token);

      expect(prismaMock.refreshToken.findUnique).toHaveBeenCalledWith({ where: { token } });
      expect(result).toEqual(tokenData);
    });

    it("should return null if token not found", async () => {
      const token = "XYZ";
      prismaMock.refreshToken.findUnique.mockResolvedValue(null);

      const result = await repo.findRefreshToken(token);

      expect(prismaMock.refreshToken.findUnique).toHaveBeenCalledWith({ where: { token } });
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
      prismaMock.refreshToken.delete.mockResolvedValue(deleted);

      const result = await repo.deleteRefreshToken(token);

      expect(prismaMock.refreshToken.delete).toHaveBeenCalledWith({ where: { token } });
      expect(result).toEqual(deleted);
    });

    it("should throw error if delete fails", async () => {
      const token = "XYZ";
      prismaMock.refreshToken.delete.mockRejectedValue(new Error("Delete Error"));

      await expect(repo.deleteRefreshToken(token)).rejects.toThrow("Delete Error");
      expect(prismaMock.refreshToken.delete).toHaveBeenCalledWith({ where: { token } });
    });
  });
});
