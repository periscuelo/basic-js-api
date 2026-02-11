import request from "supertest";
import { buildApp } from "../../app.js";
import { prisma } from "../../lib/prisma.js";
import * as argon2 from "argon2";

describe("Auth E2E", () => {
  let app;
  let server;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    server = app.server;
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    await app.close();
  });

  describe("POST /auth/login", () => {
    it("should login successfully and return accessToken + refresh cookie", async () => {
      const passwordHash = await argon2.hash("123456");

      const user = await prisma.user.create({
        data: {
          name: "John",
          email: "john@test.com",
          password: passwordHash
        }
      });

      const res = await request(server)
        .post("/auth/login")
        .send({ email: user.email, password: "123456" })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.headers["set-cookie"]).toBeDefined();
      expect(res.headers["set-cookie"][0]).toContain("refreshToken=");
    });

    it("should return 401 for invalid credentials", async () => {
      await request(server)
        .post("/auth/login")
        .send({ email: "invalid@test.com", password: "x" })
        .expect(401)
        .expect({ error: "Invalid credentials" });
    });
  });

  describe("POST /auth/refresh", () => {
    it("should rotate refresh token and return new access token", async () => {
      const passwordHash = await argon2.hash("123456");

      const user = await prisma.user.create({
        data: {
          name: "Refresh User",
          email: "refresh@test.com",
          password: passwordHash
        }
      });

      const login = await request(server)
        .post("/auth/login")
        .send({ email: user.email, password: "123456" });

      const cookie = login.headers["set-cookie"][0];

      const res = await request(server)
        .post("/auth/refresh")
        .set("Cookie", cookie)
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.headers["set-cookie"][0]).toContain("refreshToken=");
    });

    it("should return 401 if no refresh token", async () => {
      await request(server)
        .post("/auth/refresh")
        .expect(401)
        .expect({ error: "No refresh token" });
    });

    it("should return 401 if refresh token is invalid", async () => {
      await request(server)
        .post("/auth/refresh")
        .set("Cookie", "refreshToken=invalid")
        .expect(401)
        .expect({ error: "Invalid refresh token" });
    });
  });

  describe("POST /auth/logout", () => {
    it("should logout and clear refresh cookie", async () => {
      const res = await request(server).post("/auth/logout").expect(204);
      expect(res.headers["set-cookie"][0]).toContain("refreshToken=;");
    });
  });
});
