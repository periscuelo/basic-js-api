import {
  deleteUser,
  getProfile,
  listUsers,
  register,
  restoreUser,
  updateUser
} from "../controllers/user.controller.js";
import {
  registerSchema,
  getProfileSchema,
  updateUserSchema,
  listUsersSchema,
  restoreUserSchema,
  deleteUserSchema
} from "../schemas/user.schema.js";

const userRoutes = async (fastify) => {
  fastify.register(async (instance) => {
    instance.addHook('preHandler', instance.authenticate);

    instance.get("/", { schema: listUsersSchema }, listUsers);
    instance.get("/profile", { schema: getProfileSchema }, getProfile);

    instance.patch("/:id", { schema: updateUserSchema }, updateUser);
    instance.patch("/:id/restore", { schema: restoreUserSchema }, restoreUser);

    instance.delete("/:id", { schema: deleteUserSchema }, deleteUser);
  }, { prefix: "/user" });

  fastify.post("/user/register", { schema: registerSchema }, register);
};

export default userRoutes;
