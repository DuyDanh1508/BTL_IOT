const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'IoT System API',
            version: '1.0.0',
            description: 'Tài liệu API cho Hệ thống IoT (Đèn, Cảm biến, Lịch sử, Profile)',
            contact: {
                name: 'Nguyễn Duy Danh',
                email: 'danh@example.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Server Local'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    // Đường dẫn chứa các comment mô tả API (chúng ta sẽ viết ở Bước 3)
    apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;