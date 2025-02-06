const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465,
    secure: true, // true для 465 порта
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        // Не проверяем сертификат
        rejectUnauthorized: false
    }
});

// Проверка подключения при старте сервера
const verifyEmailConfig = async () => {
    try {
        await transporter.verify();
        console.log('Email service is ready');
        return true;
    } catch (error) {
        console.error('Email service error:', error);
        return false;
    }
};

const sendVerificationEmail = async (to, code) => {
    try {
        console.log('Attempting to send verification email to:', to);
        
        const mailOptions = {
            from: `"ALASH Learning Platform" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: 'Подтверждение регистрации',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Подтверждение Email</h2>
                    <p>Спасибо за регистрацию! Ваш код подтверждения:</p>
                    <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; font-weight: bold;">
                        ${code}
                    </div>
                    <p>Код действителен в течение 10 минут.</p>
                    <p style="color: #666; font-size: 12px;">Если вы не регистрировались на нашей платформе, проигнорируйте это письмо.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

const sendLoginCode = async (to, code) => {
    try {
        console.log('Attempting to send login code to:', to);
        
        const mailOptions = {
            from: `"ALASH Learning Platform" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: 'Код для входа',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Вход в систему</h2>
                    <p>Ваш код для входа:</p>
                    <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; font-weight: bold;">
                        ${code}
                    </div>
                    <p>Код действителен в течение 5 минут.</p>
                    <p style="color: #666; font-size: 12px;">Если вы не пытались войти в систему, немедленно смените пароль.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Login code sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending login code:', error);
        throw error;
    }
};

module.exports = {
    sendVerificationEmail,
    sendLoginCode,
    verifyEmailConfig
};