const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const { verifyEmailConfig } = require('./utils/emailService');
const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://learningplatformfrontend.onrender.com',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Request Logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    });

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            message: 'Validation error',
            details: Object.values(err.errors).map(e => e.message)
        });
    }

    // JWT Authentication Error
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication failed'
        });
    }

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            status: 'error',
            message: `Duplicate value for ${field}`
        });
    }

    // Default Error Response
    res.status(err.status || 500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production' 
            ? 'An error occurred' 
            : err.message
    });
});

// Initialize Server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('MongoDB Connected successfully');

        // Verify Email Configuration
        const emailConfigured = await verifyEmailConfig();
        if (!emailConfigured) {
            console.warn('Warning: Email service is not configured properly');
            console.warn('Please check your EMAIL_USER and EMAIL_PASS environment variables');
        } else {
            console.log('Email service configured successfully');
        }

        // Start Server
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
            console.log('Environment:', process.env.NODE_ENV);
            console.log('Time:', new Date().toISOString());
        });

        // Graceful Shutdown
        const shutdown = async () => {
            console.log('Shutting down server...');
            await new Promise((resolve) => server.close(resolve));
            console.log('Server closed');
            process.exit(0);
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer().catch(console.error);

module.exports = app;