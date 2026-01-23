import * as argon2 from "argon2";
import ms from "ms"
import { randomUUID } from "node:crypto";
import { findUserByEmail } from "../repositories/user.repository.js";
import {
  createRefreshToken,
  findRefreshToken,
  deleteRefreshToken
} from "../repositories/refresh-token.repository.js";

const REFRESH_TTL_MS = ms(process.env.JWT_REFRESH_EXPIRES_IN || "7d");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/auth",
};

export const login = async (req, reply) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) return reply.status(401).send({ error: "Invalid credentials" });

    const valid = await argon2.verify(user.password, password);
    if (!valid) return reply.status(401).send({ error: "Invalid credentials" });

    const accessToken = req.server.jwt.sign(
      { sub: user.id, email: user.email },
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
    );

    const refreshToken = randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    const userAgent = req.headers["user-agent"] || null;
    const ipAddress = req.ip || req.socket?.remoteAddress || null;

    await createRefreshToken({
      token: refreshToken,
      userId: user.id,
      expiresAt,
      userAgent,
      ipAddress
    });

    reply.setCookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TTL_MS / 1000,
    });

    return reply.send({ accessToken });
  } catch (err) {
    req.log.error(err);
    return reply.status(500).send({ error: "Internal server error" });
  }
};

export const refreshToken = async (req, reply) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return reply.status(401).send({ error: "No refresh token" });

  const stored = await findRefreshToken(refreshToken);
  if (!stored) return reply.status(401).send({ error: "Invalid refresh token" });

  if (stored.expiresAt < new Date()) {
    await deleteRefreshToken(refreshToken);
    reply.clearCookie("refreshToken", cookieOptions);
    return reply.status(401).send({ error: "Refresh token expired" });
  }

  // 🔥 ROTATION
  await deleteRefreshToken(refreshToken);

  const newRefreshToken = randomUUID();
  const newExpiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  const userAgent = req.headers["user-agent"] || null;
  const ipAddress = req.ip || req.socket?.remoteAddress || null;

  await createRefreshToken({
    token: newRefreshToken,
    userId: stored.userId,
    expiresAt: newExpiresAt,
    userAgent,
    ipAddress
  });

  const accessToken = req.server.jwt.sign(
    { sub: stored.userId },
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
  );

  reply.setCookie("refreshToken", newRefreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_TTL_MS / 1000,
  });

  return reply.send({ accessToken });
};

export const logout = async (req, reply) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await deleteRefreshToken(refreshToken);
  }

  reply.clearCookie("refreshToken", cookieOptions);
  return reply.status(204).send();
};
