export const loginSchema = {
  tags: ["Auth"],
  summary: "User login",
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        accessToken: { type: "string" },
      },
    },
    401: { type: "object", properties: { error: { type: "string" } } },
    500: { type: "object", properties: { error: { type: "string" } } },
  },
};

export const refreshTokenSchema = {
  tags: ["Auth"],
  summary: "Refresh access token",
  response: {
    200: {
      type: "object",
      properties: {
        accessToken: { type: "string" },
      },
    },
    401: { type: "object", properties: { error: { type: "string" } } },
  },
};

export const logoutSchema = {
  tags: ["Auth"],
  summary: "Logout user",
  response: {
    204: { type: "null" },
  },
};
