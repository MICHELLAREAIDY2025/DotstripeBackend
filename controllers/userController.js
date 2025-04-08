const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ 
            where: { email }, 
            attributes: ['id', 'name', 'email', 'role', 'address', 'password'] 
        });

        if (!user) {
            return res.status(404).json({ error: 'No account found with this email' });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: "Server configuration error: JWT_SECRET is missing." });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { 
            expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
        });

        res.cookie('token', token, {
            httpOnly: true,  
            secure: process.env.NODE_ENV === 'production',  
            sameSite: 'strict', 
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });

        const { password: _, ...userWithoutPassword } = user.dataValues;

        return res.status(200).json({ 
            message: 'Login successful', 
            user: userWithoutPassword  
        });

    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
};
  
 
const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

const validatePassword = (password) => /^(?=.*[A-Z])(?=.*\d).{6,}$/.test(password);

const hashPassword = (password) => password ? bcrypt.hashSync(password, 10) : null;

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, address } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters long, contain at least 1 uppercase letter and 1 number' 
            });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        const hashedPassword = hashPassword(password);

        const newUser = await User.create({ 
            name, 
            email, 
            password: hashedPassword, 
            role: role || 'customer',  
            address: address || null   
        });

        return res.status(201).json({ 
            message: 'User registered successfully!', 
            user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, address: newUser.address } 
        });

    } catch (error) {
        console.error('Registration Error:', error);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { name, email, newPassword, address } = req.body;
        const userId = req.user.id;  

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (email && email !== user.email) {
            if (!validateEmail(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }

            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).json({ error: 'This email is already in use' });
            }
        }

        let updatedPassword = user.password;
        if (newPassword) {
            if (!validatePassword(newPassword)) {
                return res.status(400).json({ 
                    error: 'New password must be at least 6 characters long, contain at least 1 uppercase letter and 1 number' 
                });
            }
            updatedPassword = hashPassword(newPassword);
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.password = updatedPassword;
        user.address = address || user.address;

        await user.save();

        const { password: _, ...updatedUser } = user.dataValues;

        return res.status(200).json({ 
            message: 'User updated successfully!', 
            user: updatedUser 
        });

    } catch (error) {
        console.error('Update User Error:', error);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
};


exports.logout = async (req, res) => {
    try {
        res.cookie('token', '', { 
            httpOnly: true, 
            expires: new Date(0)  
        });

        return res.status(200).json({ message: 'Logout successful!' });

    } catch (error) {
        console.error('Logout Error:', error);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
};

exports.getUserById = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied! Admins only.' });
        }

        const { id } = req.params;
        const user = await User.findByPk(id, {
            attributes: ['id', 'name', 'email', 'role', 'address']
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ user });

    } catch (error) {
        console.error('Get User By ID Error:', error);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
};
 
exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'name', 'email', 'role', 'address']
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ user });

    } catch (error) {
        console.error('Get Me Error:', error);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const orderCount = await Order.count({ where: { user_id: id } });
        if (orderCount > 0) {
            return res.status(400).json({ error: 'User cannot be deleted because they have existing orders' });
        }

        await User.destroy({ where: { id } });

        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete User Error:', error);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'address']
        });

        return res.status(200).json({ users });
    } catch (error) {
        console.error('Get All Users Error:', error);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
};
