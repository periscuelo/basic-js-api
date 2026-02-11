import request from "supertest";
import { buildApp } from "../../app.js";
import { prisma } from "../../lib/prisma.js";
import * as argon2 from "argon2";
import { randomUUID } from "node:crypto";

describe("User E2E", () => {
  let app;
  let server;

  let token;
  let user;

  const uid = randomUUID();
  const email = `admin.user+${uid}@test.com`;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    server = app.server;

    // ----------------------
    // Seed user
    // ----------------------
    const passwordHash = await argon2.hash("12345678Aa!");

    user = await prisma.user.create({
      data: {
        name: "Admin User E2E",
        email,
        password: passwordHash
      },
    });

    // ----------------------
    // Login (real /auth/login)
    // ----------------------
    const login = await request(server)
      .post("/auth/login")
      .send({ email: user.email, password: "12345678Aa!" })
      .expect(200);

    token = login.body.accessToken;
    expect(token).toBeTruthy();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  // ----------------------
  // REGISTER
  // ----------------------
  describe("POST /user/register", () => {
    it("should register a non-sales user (201)", async () => {
      const payload = {
        name: "User Normal",
        email: `normal.user+${uid}@test.com`,
        password: "12345678Aa!",
      };

      const res = await request(server)
        .post("/user/register")
        .set("Authorization", `Bearer ${token}`)
        .send(payload)
        .expect(201);

      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("name", payload.name);
      expect(res.body).toHaveProperty("email", payload.email);
    });

    it("should return 400 on invalid payload (schema validation)", async () => {
      await request(server)
        .post("/user/register")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(400)
        .expect({ error: "Bad Request" });
    });

    it("should return 409 when email already exists", async () => {
      const payload = {
        name: "Dup Email",
        email: `dup.user+${uid}@test.com`,
        password: "12345678Aa!",
      };

      await request(server)
        .post("/user/register")
        .set("Authorization", `Bearer ${token}`)
        .send(payload)
        .expect(201);

      await request(server)
        .post("/user/register")
        .set("Authorization", `Bearer ${token}`)
        .send(payload)
        .expect(409)
        .expect({ error: "Email already exists" });
    });
  });

  // ----------------------
  // LIST
  // ----------------------
  describe("GET /user", () => {
    it("should list users (paginated)", async () => {
      const res = await request(server)
        .get("/user?page=1&perPage=10")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("meta");
      expect(Array.isArray(res.body.data)).toBe(true);

      expect(res.body.meta).toHaveProperty("page");
      expect(res.body.meta).toHaveProperty("perPage");
      expect(res.body.meta).toHaveProperty("total");
    });

    it("should search users by name/email", async () => {
      const res = await request(server)
        .get("/user?search=Admin%20User%20E2E&perPage=10&page=1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ----------------------
  // PROFILE
  // ----------------------
  describe("GET /user/profile", () => {
    it("should return profile (200)", async () => {
      const res = await request(server)
        .get("/user/profile")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("email", email);
    });
  });

  // ----------------------
  // UPDATE
  // ----------------------
  describe("PATCH /user/:id", () => {
    it("should update user and return {message, user}", async () => {
      const u = await prisma.user.create({
        data: {
          name: "To Update",
          email: `to.update+${uid}@test.com`,
          password: await argon2.hash("12345678Aa!"),
        }
      });

      const res = await request(server)
        .patch(`/user/${u.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Name" })
        .expect(200);

      expect(res.body).toHaveProperty("message", "User updated");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("id", u.id);
      expect(res.body.user).toHaveProperty("name", "Updated Name");
    });
  });

  // ----------------------
  // DELETE (soft delete)
  // ----------------------
  describe("DELETE /user/:id", () => {
    it("should soft delete user and return 204", async () => {
      const u = await prisma.user.create({
        data: {
          name: "To Delete",
          email: `to.delete+${uid}@test.com`,
          password: await argon2.hash("12345678Aa!")
        },
      });

      await request(server)
        .delete(`/user/${u.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(204);

      const dbUser = await prisma.user.findUnique({ where: { id: u.id } });
      expect(dbUser).toBeTruthy();
      expect(dbUser.deletedAt).toBeTruthy();
    });
  });

  // ----------------------
  // RESTORE
  // ----------------------
  describe("PATCH /user/:id/restore", () => {
    it("should restore user and return {message, id}", async () => {
      const u = await prisma.user.create({
        data: {
          name: "To Restore",
          email: `to.restore+${uid}@test.com`,
          password: await argon2.hash("12345678Aa!"),
          deletedAt: new Date(),
        },
      });

      const res = await request(server)
        .patch(`/user/${u.id}/restore`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual({ message: "User restored", id: u.id });

      const dbUser = await prisma.user.findUnique({ where: { id: u.id } });
      expect(dbUser.deletedAt).toBeNull();
    });
  });
});
