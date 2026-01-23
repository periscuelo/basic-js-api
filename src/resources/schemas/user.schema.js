const authRequired = [{ bearerAuth: [] }];

export const registerSchema = {
  tags: ['User'],
  summary: 'Register a new user',
  description: 'Endpoint to create a new user account',
  body: {
    type: "object",
    required: ["name", "email", "password"],
    properties: {
      name: { type: "string", minLength: 4 },
      email: { type: "string", format: "email" },
      password: {
        type: "string",
        minLength: 8,
        pattern: String.raw`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\[\]{};':"\\|,.<>/?]).+$`,
        description: "Password must include uppercase, lowercase, number, and special character"
      }
    }
  },
  response: {
    201: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" }
      }
    },
    400: { type: "object", properties: { error: { type: "string" } } },
    409: { type: "object", properties: { error: { type: "string" } } }
  }
};

export const getProfileSchema = {
  tags: ['User'],
  summary: 'Get user profile',
  security: authRequired,
  response: {
    200: { type: "object", properties: { id: { type: "string" }, email: { type: "string" } } },
    401: { type: "object", properties: { error: { type: "string" } } },
    404: { type: "object", properties: { error: { type: "string" } } }
  }
};

export const updateUserSchema = {
  tags: ['User'],
  summary: 'Update user',
  security: authRequired,
  body: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 4 },
      email: { type: "string", format: "email" }
    },
    minProperties: 1
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" }
          }
        }
      }
    },
    400: { type: "object", properties: { error: { type: "string" } } },
    401: { type: "object", properties: { error: { type: "string" } } },
    404: { type: "object", properties: { error: { type: "string" } } }
  }
};

export const listUsersSchema = {
  tags: ['User'],
  summary: 'List users with pagination, sorting and search',
  security: authRequired,
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1, default: 1 },
      perPage: { type: "integer", minimum: 1, maximum: 100, default: 10 },
      sortBy: { type: "string", enum: ["createdAt", "name", "email"], default: "createdAt" },
      sortOrder: { type: "string", enum: ["asc", "desc"], default: "desc" },
      search: { type: "string", default: "" }
    }
  },
  response: {
    200: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string" },
              createdAt: { type: "string", format: "date-time" }
            }
          }
        },
        meta: {
          type: "object",
          properties: {
            page: { type: "integer" },
            perPage: { type: "integer" },
            total: { type: "integer" },
            totalPages: { type: "integer" },
            hasNextPage: { type: "boolean" },
            hasPrevPage: { type: "boolean" }
          }
        }
      }
    },
    400: { type: "object", properties: { error: { type: "string" } } },
    401: { type: "object", properties: { error: { type: "string" } } },
    500: { type: "object", properties: { error: { type: "string" } } }
  }
};

export const restoreUserSchema = {
  tags: ['User'],
  summary: 'Restore a soft-deleted user',
  security: authRequired,
  response: {
    200: { type: "object", properties: { message: { type: "string" }, id: { type: "string" } } },
    401: { type: "object", properties: { error: { type: "string" } } },
    404: { type: "object", properties: { error: { type: "string" } } }
  }
};

export const deleteUserSchema = {
  tags: ['User'],
  summary: 'Soft delete a user',
  security: authRequired,
  response: {
    204: { type: "null" },
    401: { type: "object", properties: { error: { type: "string" } } },
    404: { type: "object", properties: { error: { type: "string" } } }
  }
};
