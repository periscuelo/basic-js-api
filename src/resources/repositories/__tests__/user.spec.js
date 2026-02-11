import { jest } from "@jest/globals";

// ----------------------
// Prisma Mock
// ----------------------
jest.mock("../../../lib/prisma.js", () => {
  const user = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };

  const $transaction = jest.fn();

  return {
    prisma: {
      user,
      $transaction,
    },
    __esModule: true,
  };
});

// Imports after mock
import { prisma } from "../../../lib/prisma.js";
import * as repo from "../user.repository.js";

// ----------------------
// Testes
// ----------------------
describe("User Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------
  // CREATE
  // ----------------------
  describe("createUser", () => {
    it("should create a new user", async () => {
      const user = { id: "1", name: "John", email: "john@test.com" };
      prisma.user.create.mockResolvedValue(user);

      const result = await repo.createUser({ name: "John", email: "john@test.com", password: "HASH" });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { name: "John", email: "john@test.com", password: "HASH" },
      });
      expect(result).toEqual(user);
    });

    it("should throw if create fails", async () => {
      prisma.user.create.mockRejectedValue(new Error("DB Error"));
      await expect(repo.createUser({ name: "Fail", email: "fail@test.com", password: "HASH" })).rejects.toThrow(
        "DB Error"
      );
    });
  });

  // ----------------------
  // FIND BY EMAIL
  // ----------------------
  describe("findUserByEmail", () => {
    it("should find user by email", async () => {
      const user = { id: "1", email: "john@test.com" };
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await repo.findUserByEmail("john@test.com");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "john@test.com" } });
      expect(result).toEqual(user);
    });

    it("should return null if not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await repo.findUserByEmail("unknown@test.com");
      expect(result).toBeNull();
    });

    it("should throw if findUnique fails", async () => {
      prisma.user.findUnique.mockRejectedValue(new Error("DB Error"));
      await expect(repo.findUserByEmail("error@test.com")).rejects.toThrow("DB Error");
    });
  });

  // ----------------------
  // FIND BY ID
  // ----------------------
  describe("findUserById", () => {
    it("should find user by id", async () => {
      const user = { id: "1" };
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await repo.findUserById("1");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "1" } });
      expect(result).toEqual(user);
    });

    it("should return null if not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await repo.findUserById("2");
      expect(result).toBeNull();
    });

    it("should throw if findUnique fails", async () => {
      prisma.user.findUnique.mockRejectedValue(new Error("DB Error"));
      await expect(repo.findUserById("error")).rejects.toThrow("DB Error");
    });
  });

  // ----------------------
  // UPDATE
  // ----------------------
  describe("updateUserById", () => {
    it("should update user by id", async () => {
      const updatedUser = { id: "1", name: "John Updated", email: "john2@test.com" };
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await repo.updateUserById("1", { name: "John Updated", email: "john2@test.com" });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { name: "John Updated", email: "john2@test.com" },
        select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
      });
      expect(result).toEqual(updatedUser);
    });

    it("should throw if update fails", async () => {
      prisma.user.update.mockRejectedValue(new Error("DB Error"));
      await expect(repo.updateUserById("1", {})).rejects.toThrow("DB Error");
    });
  });

  // ----------------------
  // DELETE
  // ----------------------
  describe("deleteUserById", () => {
    it("should soft delete user", async () => {
      const deleted = { id: "1" };
      prisma.user.softDelete.mockResolvedValue(deleted);

      const result = await repo.deleteUserById("1");

      expect(prisma.user.softDelete).toHaveBeenCalledWith({ where: { id: "1" } });
      expect(result).toEqual(deleted);
    });

    it("should return null if nothing deleted", async () => {
      prisma.user.softDelete.mockResolvedValue(null);
      const result = await repo.deleteUserById("2");
      expect(result).toBeNull();
    });

    it("should throw if softDelete fails", async () => {
      prisma.user.softDelete.mockRejectedValue(new Error("DB Error"));
      await expect(repo.deleteUserById("error")).rejects.toThrow("DB Error");
    });
  });

  // ----------------------
  // RESTORE
  // ----------------------
  describe("restoreUserById", () => {
    it("should restore user", async () => {
      const restored = { id: "1" };
      prisma.user.restore.mockResolvedValue(restored);

      const result = await repo.restoreUserById("1");

      expect(prisma.user.restore).toHaveBeenCalledWith({ where: { id: "1" } });
      expect(result).toEqual(restored);
    });

    it("should return null if nothing restored", async () => {
      prisma.user.restore.mockResolvedValue(null);
      const result = await repo.restoreUserById("2");
      expect(result).toBeNull();
    });

    it("should throw if restore fails", async () => {
      prisma.user.restore.mockRejectedValue(new Error("DB Error"));
      await expect(repo.restoreUserById("error")).rejects.toThrow("DB Error");
    });
  });

  // ----------------------
  // FETCH USERS
  // ----------------------
  describe("fetchUsers", () => {
    it("should return paginated users without search", async () => {
      const users = [{ id: "1", name: "John", email: "john@test.com" }];
      prisma.$transaction.mockResolvedValue([users, 1]);

      const result = await repo.fetchUsers({ page: 1, perPage: 10 });

      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.user.findMany({
          where: {},
          select: { id: true, name: true, email: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          skip: 0,
          take: 10,
        }),
        prisma.user.count({ where: {} }),
      ]);

      expect(result).toEqual({
        data: users,
        meta: {
          page: 1,
          perPage: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    });

    it("should return paginated users with search", async () => {
      const users = [{ id: "1", name: "John", email: "john@test.com" }];
      prisma.$transaction.mockResolvedValue([users, 1]);

      const result = await repo.fetchUsers({ page: 1, perPage: 10, search: "John" });

      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.user.findMany({
          where: {
            OR: [
              { email: { contains: "John", mode: "insensitive" } },
              { name: { contains: "John", mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, email: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          skip: 0,
          take: 10,
        }),
        prisma.user.count({
          where: {
            OR: [
              { email: { contains: "John", mode: "insensitive" } },
              { name: { contains: "John", mode: "insensitive" } },
            ],
          },
        }),
      ]);

      expect(result.data).toEqual(users);
    });

    it("should return empty paginated users without search", async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      const result = await repo.fetchUsers({ page: 1, perPage: 10 });

      expect(result).toEqual({
        data: [],
        meta: {
          page: 1,
          perPage: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    });

    it("should throw if $transaction fails", async () => {
      prisma.$transaction.mockRejectedValue(new Error("DB Error"));
      await expect(repo.fetchUsers({ page: 1, perPage: 10 })).rejects.toThrow("DB Error");
    });
  });
});
