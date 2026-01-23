import { jest } from "@jest/globals";

// ----------------------
// Mocks de Módulos ESM
// ----------------------
const userRepoMock = {
  createUser: jest.fn(),
  deleteUserById: jest.fn(),
  restoreUserById: jest.fn(),
  findUserById: jest.fn(),
  fetchUsers: jest.fn(),
  updateUserById: jest.fn(),
};
jest.unstable_mockModule("../repositories/user.repository.js", () => userRepoMock);

const argon2Mock = {
  hash: jest.fn(),
};
jest.unstable_mockModule("argon2", () => argon2Mock);

// ----------------------
// Importar o controller após mocks
// ----------------------
const userRepo = await import("../repositories/user.repository.js");
const argon2 = await import("argon2");
const userController = await import("./user.controller.js");

// ----------------------
// Setup Teste
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
      argon2Mock.hash.mockResolvedValue("HASHED_PASS");
      userRepoMock.createUser.mockResolvedValue({ id: "1", name: "John", email: "john@test.com" });

      await userController.register(req, reply);

      expect(argon2Mock.hash).toHaveBeenCalledWith("pass");
      expect(userRepoMock.createUser).toHaveBeenCalledWith({ name: "John", email: "john@test.com", password: "HASHED_PASS" });
      expect(reply.code).toHaveBeenCalledWith(201);
      expect(reply.send).toHaveBeenCalledWith({ id: "1", name: "John", email: "john@test.com" });
    });

    it("should return 409 if email exists (P2002)", async () => {
      req.body = { name: "John", email: "john@test.com", password: "pass" };
      argon2Mock.hash.mockResolvedValue("HASHED_PASS");
      userRepoMock.createUser.mockRejectedValue({ code: "P2002" });

      await userController.register(req, reply);

      expect(reply.code).toHaveBeenCalledWith(409);
      expect(reply.send).toHaveBeenCalledWith({ error: "Email already exists" });
    });

    it("should return 400 on other errors", async () => {
      req.body = { name: "John", email: "john@test.com", password: "pass" };
      argon2Mock.hash.mockResolvedValue("HASHED_PASS");
      userRepoMock.createUser.mockRejectedValue(new Error("Other Error"));

      await userController.register(req, reply);

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
      userRepoMock.deleteUserById.mockResolvedValue({ id: "1" });

      await userController.deleteUser(req, reply);

      expect(userRepoMock.deleteUserById).toHaveBeenCalledWith("1");
      expect(reply.send).toHaveBeenCalledWith({ message: "User deleted", id: "1" });
    });

    it("should return 400 on error", async () => {
      req.params = { id: "1" };
      userRepoMock.deleteUserById.mockRejectedValue(new Error("Delete Error"));

      await userController.deleteUser(req, reply);

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
      userRepoMock.restoreUserById.mockResolvedValue({ id: "1" });

      await userController.restoreUser(req, reply);

      expect(userRepoMock.restoreUserById).toHaveBeenCalledWith("1");
      expect(reply.send).toHaveBeenCalledWith({ message: "User restored", id: "1" });
    });

    it("should return 400 on error", async () => {
      req.params = { id: "1" };
      userRepoMock.restoreUserById.mockRejectedValue(new Error("Restore Error"));

      await userController.restoreUser(req, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith({ error: "Restore Error" });
    });
  });

  // ----------------------
  // GET PROFILE
  // ----------------------
  describe("getProfile", () => {
    it("should return user profile", async () => {
      userRepoMock.findUserById.mockResolvedValue({ id: "1", email: "john@test.com" });

      await userController.getProfile(req, reply);

      expect(userRepoMock.findUserById).toHaveBeenCalledWith("1");
      expect(reply.send).toHaveBeenCalledWith({ id: "1", email: "john@test.com" });
    });

    it("should return 404 if user not found", async () => {
      userRepoMock.findUserById.mockResolvedValue(null);

      await userController.getProfile(req, reply);

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
      userRepoMock.fetchUsers.mockResolvedValue([{ id: "1", name: "John" }]);

      await userController.listUsers(req, reply);

      expect(userRepoMock.fetchUsers).toHaveBeenCalledWith(req.query);
      expect(reply.send).toHaveBeenCalledWith([{ id: "1", name: "John" }]);
    });

    it("should return 500 on error", async () => {
      userRepoMock.fetchUsers.mockRejectedValue(new Error("Fetch Error"));

      await userController.listUsers(req, reply);

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
      userRepoMock.updateUserById.mockResolvedValue({ id: "1", name: "John Updated", email: "john2@test.com" });

      await userController.updateUser(req, reply);

      expect(userRepoMock.updateUserById).toHaveBeenCalledWith("1", { name: "John Updated", email: "john2@test.com" });
      expect(reply.send).toHaveBeenCalledWith({
        message: "User updated",
        user: { id: "1", name: "John Updated", email: "john2@test.com" },
      });
    });

    it("should return 400 on error", async () => {
      req.params = { id: "1" };
      req.body = { name: "John Updated", email: "john2@test.com" };
      userRepoMock.updateUserById.mockRejectedValue(new Error("Update Error"));

      await userController.updateUser(req, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith({ error: "Update Error" });
    });
  });
});
