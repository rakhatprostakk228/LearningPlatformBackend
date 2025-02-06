const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth'; // Updated to match your server configuration

// Test user data
const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
};

let userId;

// Helper function to log test results
const logTest = (testName, success) => {
    console.log(`${success ? '✓' : '✗'} ${testName}`);
};

async function runTests() {
    try {
        // Test 1: Register new user
        console.log('\nTesting User Registration:');
        try {
            const registerResponse = await axios.post(`${API_URL}/register`, testUser);
            logTest('Register new user', registerResponse.status === 200);
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.msg === 'User already exists') {
                logTest('Register new user (User exists)', true);
            } else {
                console.error('Registration error:', error.response?.data || error.message);
                throw error;
            }
        }

        // Test 2: Login with created user
        console.log('\nTesting Login:');
        const loginResponse = await axios.post(`${API_URL}/login`, {
            email: testUser.email,
            password: testUser.password
        });
        logTest('Login with correct credentials', loginResponse.status === 200);

        // Test 3: Failed login attempt
        console.log('\nTesting Invalid Login:');
        try {
            await axios.post(`${API_URL}/login`, {
                email: testUser.email,
                password: 'wrongpassword'
            });
        } catch (error) {
            logTest('Login with wrong password', error.response?.status === 400);
        }

        // Test 4: Get all users
        console.log('\nTesting Get All Users:');
        const allUsersResponse = await axios.get(`${API_URL}/users`);
        logTest('Retrieve all users', allUsersResponse.status === 200);
        
        // Store a user ID for subsequent tests
        userId = allUsersResponse.data[0]._id;

        // Test 5: Get single user
        console.log('\nTesting Get Single User:');
        const singleUserResponse = await axios.get(`${API_URL}/users/${userId}`);
        logTest('Retrieve single user', singleUserResponse.status === 200);

        // Test 6: Update user
        console.log('\nTesting Update User:');
        const updateResponse = await axios.put(`${API_URL}/users/${userId}`, {
            name: 'Updated Test User'
        });
        logTest('Update user information', updateResponse.status === 200);

        // Test 7: Delete user
        console.log('\nTesting Delete User:');
        const deleteResponse = await axios.delete(`${API_URL}/users/${userId}`);
        logTest('Delete user', deleteResponse.status === 200);

        // Test 8: Verify user deletion
        console.log('\nVerifying User Deletion:');
        try {
            await axios.get(`${API_URL}/users/${userId}`);
        } catch (error) {
            logTest('User no longer exists', error.response?.status === 404);
        }

    } catch (error) {
        console.error('\nTest failed:', error.response?.data || error.message);
    }
}

// Run the tests
runTests();