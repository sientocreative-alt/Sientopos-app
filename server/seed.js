const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Table = require('./models/Table');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pos_db')
    .then(() => console.log('MongoDB Connected for Seeding'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});
        await Table.deleteMany({});

        // Create Admin User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const admin = new User({
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
            fullName: 'Admin User',
            pin: '1234'
        });
        await admin.save();
        console.log('Admin user created: admin / 123456');

        // Create Categories
        const catFood = new Category({ name: 'Yiyecekler', order: 1 });
        const catDrink = new Category({ name: 'İçecekler', order: 2 });
        await catFood.save();
        await catDrink.save();

        // Create Products
        await Product.create({
            name: 'Hamburger',
            price: 250,
            category: catFood._id,
            description: 'Classic burger',
            options: [{ name: 'Pişirme', choices: [{ name: 'Az' }, { name: 'Orta' }, { name: 'Çok' }] }]
        });
        await Product.create({
            name: 'Cola',
            price: 50,
            category: catDrink._id,
            description: '330ml'
        });

        // Create Tables
        await Table.create({ name: 'Masa 1', section: 'Salon' });
        await Table.create({ name: 'Masa 2', section: 'Salon' });
        await Table.create({ name: 'Bahçe 1', section: 'Bahçe' });

        console.log('Sample data seeded successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
