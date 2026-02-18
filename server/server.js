const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const paymentRoutes = require('./routes/payment.routes');
const cardRoutes = require('./routes/card.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const planRoutes = require('./routes/plan.routes');
const { initRecurringJob } = require('./jobs/recurringPayment');
// Last Updated: 2026-02-14T20:50:00

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// GLOBAL REQUEST LOGGER
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Socket.io Setup
const io = new Server(httpServer, {
    cors: {
        origin: true,
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});


// PayTR Routes (Old)
app.use('/api/payment', paymentRoutes);
app.use('/api/card', cardRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/webhook', require('./routes/webhook.routes'));
app.use('/api/plans', planRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pos_db')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const seatingRoutes = require('./routes/seatingRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/menu', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/seating', seatingRoutes);

// Feedback submission route
app.get('/isletme/qr/feedback/:business_id', async (req, res) => {
    const { business_id } = req.params;
    console.log('Fetching feedback for business_id:', business_id);

    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data, error } = await supabase
            .from('customer_feedback')
            .select('*')
            .eq('business_id', business_id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase fetch error:', error);
            throw error;
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/isletme/qr/feedback/:id', async (req, res) => {
    const { id } = req.params;
    console.log('Deleting feedback with id:', id);

    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { error } = await supabase
            .from('customer_feedback')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase delete error:', error);
            throw error;
        }

        res.json({ success: true, message: 'Geri bildirim başarıyla silindi' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/isletme/qr/feedback', async (req, res) => {
    console.log('Feedback endpoint hit');
    console.log('Request body:', req.body);

    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { business_id, full_name, phone, email, subject, message } = req.body;

        console.log('Extracted data:', { business_id, full_name, phone, email, subject, message });

        if (!business_id || !full_name || !subject || !message) {
            console.error('Missing required fields');
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: business_id, full_name, subject, message'
            });
        }

        console.log('Attempting to insert into database...');
        const { data, error } = await supabase
            .from('customer_feedback')
            .insert([{
                business_id,
                full_name,
                phone,
                email,
                subject,
                message
            }])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Feedback inserted successfully:', data);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Feedback submission error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('API is running...');
});

const { initPrinterService } = require('./services/printerService');

// Port
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log('****************************************');
    console.log(`* SERVER STARTED ON PORT ${PORT}      *`);
    console.log('****************************************');
    console.log(`[${new Date().toISOString()}] Server is listening...`);

    // Force restart at: 2026-02-11T23:45:00
    initPrinterService();
    initRecurringJob();
});
