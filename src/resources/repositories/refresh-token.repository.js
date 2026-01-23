import { prisma } from '../../lib/prisma.js'

export const createRefreshToken = (data) => {
  return prisma.refreshToken.create({ data });
}

export const findRefreshToken = (token) => {
  return prisma.refreshToken.findUnique({ where: { token } });
}

export const deleteRefreshToken = (token) => {
  return prisma.refreshToken.delete({ where: { token } });
}
