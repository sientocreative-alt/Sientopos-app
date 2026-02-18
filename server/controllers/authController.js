const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Supabase Admin Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

exports.createStaff = async (req, res) => {
    try {
        const { email, password, firstName, lastName, role, businessId } = req.body;

        const { data, error } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Auto confirm email
            user_metadata: {
                first_name: firstName,
                last_name: lastName,
                role: role,
                business_id: businessId
            }
        });

        if (error) throw error;

        res.status(201).json({ user: data.user, message: 'Staff created successfully' });
    } catch (error) {
        console.error('Error creating staff:', error);
        res.status(500).json({ message: 'Error creating staff', error: error.message });
    }
};

exports.register = async (req, res) => {
    try {
        const { username, password, role, fullName, pin } = req.body;

        // Check if user exists
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ message: 'User already exists' });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            username,
            password: hashedPassword,
            role,
            fullName,
            pin
        });

        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check user
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Create Token
        const payload = {
            userId: user._id,
            role: user.role,
            username: user.username
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '12h' });

        res.json({ token, user: { id: user._id, username: user.username, role: user.role, fullName: user.fullName } });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
