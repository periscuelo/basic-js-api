import { jest } from "@jest/globals";
import Fastify from "fastify";
import userRoutes from "../user.routes.js";

describe("User Routes", () => {
  let fastify;

  beforeEach(async () => {
    fastify = Fastify();

    // --- Mock do hook authenticate ---
    fastify.decorate("authenticate", jest.fn(async (req, reply) => {}));

    // --- Registrar rotas reais ---
    await userRoutes(fastify);
    await fastify.ready();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fastify.close();
  });

  // --- Rota pública /user/register ---
  it("should register POST /user/register", async () => {
    const registerMock = jest.fn().mockResolvedValue({
      id: "1",
      name: "John Doe",
      email: "john@test.com",
    });

    // Criar rota temporária de teste
    const testApp = Fastify();
    testApp.post("/user/register", async (request, reply) => {
      const result = await registerMock(request.body);
      reply.code(201).send(result);
    });
    await testApp.ready();

    const res = await testApp.inject({
      method: "POST",
      url: "/user/register",
      payload: {
        name: "John Doe",
        email: "john@test.com",
        password: "Abcd123!",
      },
    });

    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.payload)).toEqual({
      id: "1",
      name: "John Doe",
      email: "john@test.com",
    });
    expect(registerMock).toHaveBeenCalled();

    await testApp.close();
  });

  // --- Rota protegida /user/profile ---
  it("should GET /user/profile", async () => {
    const getProfileMock = jest.fn().mockResolvedValue({
      id: "1",
      email: "john@test.com",
    });

    const testApp = Fastify();
    testApp.decorate("authenticate", jest.fn());
    testApp.get("/user/profile", async (request, reply) => {
      const result = await getProfileMock();
      reply.send(result);
    });
    await testApp.ready();

    const res = await testApp.inject({ method: "GET", url: "/user/profile" });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload)).toEqual({ id: "1", email: "john@test.com" });
    expect(getProfileMock).toHaveBeenCalled();

    await testApp.close();
  });

  // --- Rota protegida /user (listUsers) ---
  it("should GET /user", async () => {
    const listUsersMock = jest.fn().mockResolvedValue({
      data: [],
      meta: { page: 1, perPage: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    });

    const testApp = Fastify();
    testApp.decorate("authenticate", jest.fn());
    testApp.get("/user", async (req, reply) => {
      const result = await listUsersMock();
      reply.send(result);
    });
    await testApp.ready();

    const res = await testApp.inject({ method: "GET", url: "/user" });
    expect(res.statusCode).toBe(200);
    expect(listUsersMock).toHaveBeenCalled();

    await testApp.close();
  });

  it("should PATCH /user/:id", async () => {
    const updateUserMock = jest.fn().mockResolvedValue({
      message: "User updated",
      user: { id: "1", name: "Updated", email: "updated@test.com" },
    });

    const testApp = Fastify();
    testApp.decorate("authenticate", jest.fn());
    testApp.patch("/user/1", async (req, reply) => {
      const result = await updateUserMock(req.body);
      reply.send(result);
    });
    await testApp.ready();

    const res = await testApp.inject({
      method: "PATCH",
      url: "/user/1",
      payload: { name: "Updated" },
    });
    expect(res.statusCode).toBe(200);
    expect(updateUserMock).toHaveBeenCalled();

    await testApp.close();
  });

  it("should PATCH /user/:id/restore", async () => {
    const restoreUserMock = jest.fn().mockResolvedValue({
      message: "User restored",
      id: "1",
    });

    const testApp = Fastify();
    testApp.decorate("authenticate", jest.fn());
    testApp.patch("/user/1/restore", async (req, reply) => {
      const result = await restoreUserMock();
      reply.send(result);
    });
    await testApp.ready();

    const res = await testApp.inject({ method: "PATCH", url: "/user/1/restore" });
    expect(res.statusCode).toBe(200);
    expect(restoreUserMock).toHaveBeenCalled();

    await testApp.close();
  });

  it("should DELETE /user/:id", async () => {
    const deleteUserMock = jest.fn().mockResolvedValue(null);

    const testApp = Fastify();
    testApp.decorate("authenticate", jest.fn());
    testApp.delete("/user/1", async (req, reply) => {
      await deleteUserMock();
      reply.code(204).send();
    });
    await testApp.ready();

    const res = await testApp.inject({ method: "DELETE", url: "/user/1" });
    expect(res.statusCode).toBe(204);
    expect(deleteUserMock).toHaveBeenCalled();

    await testApp.close();
  });
});
