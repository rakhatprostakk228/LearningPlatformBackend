const mongoose = require('mongoose');
const Course = require('../models/Course');

const MONGO_URI = 'mongodb+srv://bakhytzhan:1234@cluster0.wii3v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const clearDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        
        await Course.deleteMany({});
        console.log('All courses deleted successfully');
        
    } catch (error) {
        console.error('Error clearing database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

clearDatabase();