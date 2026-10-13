const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'AmbulanceConnect API',
    version: '1.0.0',
    description:
      'Emergency Ambulance Service Management System REST API documentation.\n\n*Note: This application is an educational prototype and not a substitute for calling local emergency hotlines (911 / 112 / 108).*'
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server'
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
  paths: {
    '/health': {
      get: {
        summary: 'Check API and Database Health',
        responses: {
          200: { description: 'System health check is OK' }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Jane Doe' },
                  email: { type: 'string', example: 'jane@example.com' },
                  password: { type: 'string', example: 'secret123' },
                  phone: { type: 'string', example: '+1-555-0199' },
                  role: { type: 'string', enum: ['patient', 'driver', 'admin'], default: 'patient' }
                },
                required: ['name', 'email', 'password', 'phone']
              }
            }
          }
        },
        responses: {
          201: { description: 'User successfully registered' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate and receive JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'patient@example.com' },
                  password: { type: 'string', example: 'password123' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          200: { description: 'Authenticated successfully' }
        }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Current user profile retrieved' }
        }
      }
    },
    '/ambulances': {
      get: {
        summary: 'List and filter ambulances',
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['BLS', 'ALS', 'ICU'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Available', 'Assigned', 'On Trip', 'Offline'] } },
          { name: 'isOnline', in: 'query', schema: { type: 'boolean' } }
        ],
        responses: {
          200: { description: 'List of ambulances' }
        }
      },
      post: {
        summary: 'Register a new ambulance (Admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ambulanceNumber: { type: 'string', example: 'AMB-105' },
                  registrationNumber: { type: 'string', example: 'KA-01-EF-4567' },
                  type: { type: 'string', enum: ['BLS', 'ALS', 'ICU'], example: 'ALS' },
                  location: {
                    type: 'object',
                    properties: {
                      latitude: { type: 'number', example: 12.9716 },
                      longitude: { type: 'number', example: 77.5946 },
                      address: { type: 'string', example: 'Central City Hospital Base' }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Ambulance created' }
        }
      }
    },
    '/ambulances/available': {
      get: {
        summary: 'Get all online & available ambulances',
        responses: {
          200: { description: 'Available ambulances' }
        }
      }
    },
    '/ambulances/{id}': {
      get: {
        summary: 'Get ambulance details by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Ambulance details' }
        }
      }
    },
    '/ambulances/{id}/status': {
      patch: {
        summary: 'Update ambulance status (Driver/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['Available', 'Assigned', 'On Trip', 'Offline'] },
                  isOnline: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Status updated' }
        }
      }
    },
    '/ambulances/{id}/location': {
      patch: {
        summary: 'Update ambulance GPS coordinates (Driver/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  latitude: { type: 'number', example: 12.975 },
                  longitude: { type: 'number', example: 77.599 },
                  address: { type: 'string', example: 'Main St En Route' }
                },
                required: ['latitude', 'longitude']
              }
            }
          }
        },
        responses: {
          200: { description: 'Location updated' }
        }
      }
    },
    '/requests': {
      post: {
        summary: 'Request an emergency ambulance',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  pickup: {
                    type: 'object',
                    properties: {
                      address: { type: 'string', example: '124 MG Road, Indiranagar' },
                      latitude: { type: 'number', example: 12.9716 },
                      longitude: { type: 'number', example: 77.5946 }
                    },
                    required: ['address', 'latitude', 'longitude']
                  },
                  patientContactNumber: { type: 'string', example: '+1-555-0199' },
                  emergencyType: {
                    type: 'string',
                    enum: [
                      'Cardiac Arrest',
                      'Accident & Trauma',
                      'Respiratory Distress',
                      'Stroke',
                      'Maternal / Pregnancy',
                      'Severe Fever / Infection',
                      'Other Emergency'
                    ]
                  },
                  requestedAmbulanceType: { type: 'string', enum: ['BLS', 'ALS', 'ICU'] }
                },
                required: ['pickup', 'patientContactNumber', 'emergencyType', 'requestedAmbulanceType']
              }
            }
          }
        },
        responses: {
          201: { description: 'Emergency request submitted and assigned' }
        }
      }
    },
    '/requests/my': {
      get: {
        summary: 'Get authenticated user emergency requests',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of requests' }
        }
      }
    },
    '/requests/{id}': {
      get: {
        summary: 'Get emergency request details',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Request details' }
        }
      }
    },
    '/requests/{id}/status': {
      get: {
        summary: 'Get emergency status and timeline',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Request status details' }
        }
      },
      patch: {
        summary: 'Update emergency status (Driver/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['ACCEPTED', 'DISPATCHED', 'ARRIVING', 'PATIENT_PICKED_UP', 'COMPLETED', 'REJECTED']
                  },
                  note: { type: 'string' }
                },
                required: ['status']
              }
            }
          }
        },
        responses: {
          200: { description: 'Status updated' }
        }
      }
    },
    '/requests/{id}/cancel': {
      patch: {
        summary: 'Cancel an ambulance request (Owner/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  cancellationReason: { type: 'string', example: 'Patient reached hospital via family vehicle' }
                },
                required: ['cancellationReason']
              }
            }
          }
        },
        responses: {
          200: { description: 'Request cancelled' }
        }
      }
    },
    '/requests/{id}/location': {
      get: {
        summary: 'Get assigned ambulance last known GPS location',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Location retrieved' }
        }
      }
    },
    '/admin/dashboard': {
      get: {
        summary: 'Get administrative dashboard metrics',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Dashboard metrics' }
        }
      }
    },
    '/admin/analytics': {
      get: {
        summary: 'Get emergency analytics breakdown',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Analytics data' }
        }
      }
    }
  }
};

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
};

module.exports = setupSwagger;
