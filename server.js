const express = require('express');
const { PORT } = require('./config.js');

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Autodesk APS Model API',
    version: '1.0.0',
    description:
      'API for uploading, listing, and checking status of Autodesk models.',
  },
  servers: [
    {
      url: `http://localhost:${PORT}`, // or your deployed URL
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // where your routes are defined
};

const swaggerSpec = swaggerJsdoc(options);

let app = express();
app.use(express.static('wwwroot'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(require('./routes/auth.js'));
app.use(require('./routes/models.js'));

app.listen(PORT, function () {
  console.log(`Server listening on port ${PORT}...`);
});
