const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Token = require("../models/Token");
const Verification = require("../models/Verification"); // Добавляем
const { sendVerificationEmail, sendLoginCode } = require("../utils/emailService"); // Добавляем
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require("../middleware/auth");

const generateCode = () => Math.random().toString().slice(2, 8);

router.get("/profile", async (req, res) => {
    try {
        const userId = req.query.userId;
        
        if (!userId) {
            return res.status(400).json({ msg: "User ID is required" });
        }

        const user = await User.findById(userId).select('-password'); 
        
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
});

// Create User (Register)
router.post("/register", async (req, res) => {
    console.log('Registration attempt:', {
        name: req.body.name,
        email: req.body.email
    });

    const { name, email, password } = req.body;

    // Проверка входных данных
    if (!name || !email || !password) {
        console.log('Missing required fields');
        return res.status(400).json({ 
            msg: "Missing required fields",
            details: {
                name: !name,
                email: !email,
                password: !password
            }
        });
    }

    try {
        // Проверка существующего пользователя
        let user = await User.findOne({ email });
        if (user) {
            console.log('User already exists:', email);
            return res.status(400).json({ msg: "User already exists" });
        }

        console.log('Creating new user...');
        
        // Хеширование пароля
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Создание пользователя
        user = new User({
            name,
            email,
            password: hashedPassword,
            isVerified: false
        });

        await user.save();
        console.log('User saved successfully');

        // Генерация кода подтверждения
        const code = generateCode();
        console.log('Generated verification code for:', email);

        // Создание записи верификации
        const verification = new Verification({
            email,
            code,
            type: 'registration'
        });

        await verification.save();
        console.log('Verification record saved');

        // Отправка email
        try {
            await sendVerificationEmail(email, code);
            console.log('Verification email sent successfully');
        } catch (emailError) {
            console.error('Error sending verification email:', emailError);
            // Удаляем созданные записи в случае ошибки
            await User.findOneAndDelete({ email });
            await Verification.findOneAndDelete({ email });
            return res.status(500).json({ 
                msg: "Error sending verification email",
                details: emailError.message
            });
        }

        res.status(200).json({ 
            msg: "Registration initiated. Please check your email for verification code",
            email
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ 
            msg: "Server error",
            details: err.message
        });
    }
});

router.post("/verify-email", async (req, res) => {
    const { email, code } = req.body;
    try {
        const verification = await Verification.findOne({
            email,
            code,
            type: 'registration'
        });

        if (!verification) {
            return res.status(400).json({ msg: "Invalid or expired code" });
        }

        await User.findOneAndUpdate({ email }, { isVerified: true });
        await Verification.deleteOne({ _id: verification._id });

        res.status(200).json({ msg: "Email verified successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
});

// Log in User
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        if (!user.isVerified) {
            return res.status(400).json({ msg: "Email not verified" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        // Создаем и отправляем код для входа
        const code = generateCode();
        const verification = new Verification({
            email,
            code,
            type: 'login'
        });
        await verification.save();

        // Отправляем код на email
        await sendLoginCode(email, code);

        res.status(200).json({ 
            msg: "Login code sent to email",
            email
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
});

router.post("/verify-login", async (req, res) => {
    const { email, code } = req.body;
    try {
        const verification = await Verification.findOne({
            email,
            code,
            type: 'login'
        });

        if (!verification) {
            return res.status(400).json({ msg: "Invalid or expired code" });
        }

        const user = await User.findOne({ email });

        // Создаем JWT токен
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: '24h' }
        );

        // Сохраняем токен в БД
        const tokenDoc = new Token({
            userId: user._id,
            token
        });
        await tokenDoc.save();

        // Удаляем использованный код
        await Verification.deleteOne({ _id: verification._id });

        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        };

        res.status(200).json({
            msg: "Login successful",
            token,
            user: userData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
});

// Logout User
router.post("/logout", auth, async (req, res) => {
    try {
        // Удаляем токен из БД
        await Token.findOneAndDelete({ token: req.token });
        res.status(200).json({ msg: "Logged out successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
});
// Retrieve All Users
router.get("/users", async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Retrieve Single User by ID
router.get("/users/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Update User by ID
router.put("/users/:id", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const updatedFields = {};

        if (name) updatedFields.name = name;
        if (email) updatedFields.email = email;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updatedFields.password = await bcrypt.hash(password, salt);
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updatedFields },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Delete User by ID
router.delete("/users/:id", async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
