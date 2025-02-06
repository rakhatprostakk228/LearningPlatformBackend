const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Register a new user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });

        await user.save();
        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

// Log in a user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        res.json({ message: "Login successful!" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { registerUser, loginUser };
