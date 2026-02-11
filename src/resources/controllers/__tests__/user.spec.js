import { jest } from "@jest/globals";

// ----------------------
// Mocks
// ----------------------
jest.mock("argon2", () => ({
  __esModule: true,
  hash: jest.fn(),
}));

jest.mock("../../repositories/user.repository.js", () => ({
  __esModule: true,
  createUser: jest.fn(),
  deleteUserById: jest.fn(),
  fetchUsers: jest.fn(),
  findUserById: jest.fn(),
  restoreUserById: jest.fn(),
  updateUserById: jest.fn(),
}));

import * as argon2 from "argon2";
import * as repo from "../../repositories/user.repository.js";
import {
  register,
  deleteUser,
  restoreUser,
  getProfile,
  listUsers,
  updateUser,
} from "../user.controller.js";

// ----------------------
// Setup Test
// ----------------------
describe("User Controller", () => {
  let req;
  let reply;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: { id: "1" },
    };

    reply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  // ----------------------
  // REGISTER
  // ----------------------
  describe("register", () => {
    it("should register a new user", async () => {
      req.body = { name: "John", email: "john@test.com", password: "pass" };
      argon2.hash.mockResolvedValue("HASHED_PASS");
      repo.createUser.mockResolvedValue({ id: "1", name: "John", email: "john@test.com" });

      await register(req, reply);

      expect(argon2.hash).toHaveBeenCalledWith("pass");
      expect(repo.createUser).toHaveBeenCalledWith({ name: "John", email: "john@test.com", password: "HASHED_PASS" });
      expect(reply.code).toHaveBeenCalledWith(201);
      expect(reply.send).toHaveBeenCalledWith({ id: "1", name: "John", email: "john@test.com" });
    });

    it("should return 409 if email exists (P2002)", async () => {
      req.body = { name: "John", email: "john@test.com", password: "pass" };
      argon2.hash.mockResolvedValue("HASHED_PASS");
      repo.createUser.mockRejectedValue({ code: "P2002" });

      await register(req, reply);

      expect(reply.code).toHaveBeenCalledWith(409);
      expect(reply.send).toHaveBeenCalledWith({ error: "Email already exists" });
    });

    it("should return 400 on other errors", async () => {
      req.body = { name: "John", email: "john@test.com", password: "pass" };
      argon2.hash.mockResolvedValue("HASHED_PASS");
      repo.createUser.mockRejectedValue(new Error("Other Error"));

      await register(req, reply);

      expect(reply.code).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith({ error: "Other Error" });
    });
  });

  // ----------------------
  // DELETE USER
  // ----------------------
  describe("deleteUser", () => {
    it("should delete user", async () => {
      req.params = { id: "1" };
      repo.deleteUserById.mockResolvedValue({ id: "1" });

      await deleteUser(req, reply);

      expect(repo.deleteUserById).toHaveBeenCalledWith("1");
      expect(reply.code).toHaveBeenCalledWith(204);
      expect(reply.send).toHaveBeenCalledWith();
    });

    it("should return 400 on error", async () => {
      req.params = { id: "1" };
      repo.deleteUserById.mockRejectedValue(new Error("Delete Error"));

      await deleteUser(req, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith({ error: "Delete Error" });
    });
  });

  // ----------------------
  // RESTORE USER
  // ----------------------
  describe("restoreUser", () => {
    it("should restore user", async () => {
      req.params = { id: "1" };
      repo.restoreUserById.mockResolvedValue({ id: "1" });

      await restoreUser(req, reply);

      expect(repo.restoreUserById).toHaveBeenCalledWith("1");
      expect(reply.send).toHaveBeenCalledWith({ message: "User restored", id: "1" });
    });

    it("should return 400 on error", async () => {
      req.params = { id: "1" };
      repo.restoreUserById.mockRejectedValue(new Error("Restore Error"));

      await restoreUser(req, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith({ error: "Restore Error" });
    });
  });

  // ----------------------
  // GET PROFILE
  // ----------------------
  describe("getProfile", () => {
    it("should return user profile", async () => {
      const req = { user: { sub: "1" } };
      repo.findUserById.mockResolvedValue({ id: "1", email: "john@test.com" });

      await getProfile(req, reply);

      expect(repo.findUserById).toHaveBeenCalledWith("1");
      expect(reply.send).toHaveBeenCalledWith({ id: "1", email: "john@test.com" });
    });

    it("should return 404 if user not found", async () => {
      repo.findUserById.mockResolvedValue(null);

      await getProfile(req, reply);

      expect(reply.status).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalledWith({ error: "User not found" });
    });
  });

  // ----------------------
  // LIST USERS
  // ----------------------
  describe("listUsers", () => {
    it("should return list of users", async () => {
      req.query = { page: 1, perPage: 10, sortBy: "name", sortOrder: "asc", search: "John" };
      repo.fetchUsers.mockResolvedValue([{ id: "1", name: "John" }]);

      await listUsers(req, reply);

      expect(repo.fetchUsers).toHaveBeenCalledWith(req.query);
      expect(reply.send).toHaveBeenCalledWith([{ id: "1", name: "John" }]);
    });

    it("should return 500 on error", async () => {
      repo.fetchUsers.mockRejectedValue(new Error("Fetch Error"));

      await listUsers(req, reply);

      expect(reply.status).toHaveBeenCalledWith(500);
      expect(reply.send).toHaveBeenCalledWith({ error: "Fetch Error" });
    });
  });

  // ----------------------
  // UPDATE USER
  // ----------------------
  describe("updateUser", () => {
    it("should update user", async () => {
      req.params = { id: "1" };
      req.body = { name: "John Updated", email: "john2@test.com" };
      repo.updateUserById.mockResolvedValue({ id: "1", name: "John Updated", email: "john2@test.com" });

      await updateUser(req, reply);

      expect(repo.updateUserById).toHaveBeenCalledWith("1", { name: "John Updated", email: "john2@test.com" });
      expect(reply.send).toHaveBeenCalledWith({
        message: "User updated",
        user: { id: "1", name: "John Updated", email: "john2@test.com" },
      });
    });

    it("should return 400 on error", async () => {
      req.params = { id: "1" };
      req.body = { name: "John Updated", email: "john2@test.com" };
      repo.updateUserById.mockRejectedValue(new Error("Update Error"));

      await updateUser(req, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith({ error: "Update Error" });
    });
  });
});
