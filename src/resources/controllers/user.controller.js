import * as argon2 from "argon2";
import {
  createUser,
  deleteUserById,
  fetchUsers,
  findUserById,
  restoreUserById,
  updateUserById
} from "../repositories/user.repository.js";

export const register = async (req, reply) => {
  try {
    const { name, email, password } = req.body;
    const hashed = await argon2.hash(password);
    const user = await createUser({ name, email, password: hashed });
    return reply.code(201).send({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    if (err.code === 'P2002') {
      return reply.code(409).send({ error: "Email already exists" });
    }
    return reply.code(400).send({ error: err.message });
  }
};

export const deleteUser = async (req, reply) => {
  try {
    await deleteUserById(req.params.id);
    return reply.code(204).send();
  } catch (err) {
    return reply.status(400).send({ error: err.message });
  }
};

export const restoreUser = async (req, reply) => {
  try {
    const user = await restoreUserById(req.params.id);
    return reply.send({ message: "User restored", id: user.id });
  } catch (err) {
    return reply.status(400).send({ error: err.message });
  }
};

export const getProfile = async (req, reply) => {
  try {
    const user = await findUserById(req.user.sub);
    if (!user) throw new Error("User not found");

    return reply.send({ id: user.id, email: user.email });
  } catch (err) {
    return reply.status(404).send({ error: err.message });
  }
};

export const listUsers = async (req, reply) => {
  try {
    const { page, perPage, sortBy, sortOrder, search } = req.query;
    const result = await fetchUsers({ page, perPage, sortBy, sortOrder, search });
    return reply.send(result);
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
};

export const updateUser = async (req, reply) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const updatedUser = await updateUserById(id, { name, email });
    return reply.send({ message: "User updated", user: updatedUser });
  } catch (err) {
    return reply.status(400).send({ error: err.message });
  }
};
