import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Workflex Assessment API",
      version: "1.0.0",
      description:
        "API documentation for the Workflex Bridge Agent coding challenge.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local server",
      },
    ],
    components: {
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            email: { type: "string" },
          },
        },
        AppResponse: {
          type: "object",
          properties: {
            data: { type: "object" },
            error: { type: "string" },
            statusCode: { type: "number" },
          },
        },
      },
    },
  },
  apis: [
    "./src/controllers/*.ts",
    "./src/routes/*.ts",
    "./dist/controllers/*.js",
    "./dist/routes/*.js",
  ], // files containing annotations
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
