import { prisma } from '../../lib/prisma.js'

export const createUser = async ({ name, email, password }) => {
  return prisma.user.create({
    data: { name, email, password }
  });
};

export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const updateUserById = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
  });
};

export const deleteUserById = async (id) => {
  return prisma.user.softDelete({
    where: { id },
  })
}

export const restoreUserById = async (id) => {
  return prisma.user.restore({ where: { id } })
}

export const fetchUsers = async ({ page = 1, perPage = 10, sortBy = "createdAt", sortOrder = "desc", search = "" }) => {
  const take = Number.parseInt(perPage);
  const skip = (Number.parseInt(page) - 1) * take;

  const where = search ? {
    OR: [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ],
  } : {};

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    meta: {
      page: Number.parseInt(page),
      perPage: take,
      total,
      totalPages: Math.ceil(total / take),
      hasNextPage: page < Math.ceil(total / take),
      hasPrevPage: page > 1
    },
  };
};
