import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

export function setupSwagger(app: Application) {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Hospital Management System API',
        version: '1.0.0',
        description: 'API documentation for the Hospital Management System',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{
        bearerAuth: [],
      }],
    },
    apis: ['./src/routes/*.ts', './src/models/*.ts'], // Path to the API docs
  };

  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
  }));
}
