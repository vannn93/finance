const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

dotenv.config();

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Transaction.deleteMany({});

        console.log('Cleared existing data');

        // Create Dummy User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const testUser = new User({
            username: 'demo_user',
            password: hashedPassword
        });

        const savedUser = await testUser.save();
        console.log('Dummy user created: username="demo_user", password="password123"');

        // Create Dummy Transactions
        const dummyTransactions = [
            {
                userId: savedUser._id,
                type: 'income',
                amount: 5000000,
                category: 'Gaji',
                description: 'Gaji bulan ini',
                date: new Date(new Date().setDate(new Date().getDate() - 5))
            },
            {
                userId: savedUser._id,
                type: 'expense',
                amount: 150000,
                category: 'Makanan',
                description: 'Makan siang dengan tim',
                date: new Date(new Date().setDate(new Date().getDate() - 4))
            },
            {
                userId: savedUser._id,
                type: 'expense',
                amount: 300000,
                category: 'Belanja',
                description: 'Beli buku',
                date: new Date(new Date().setDate(new Date().getDate() - 2))
            },
            {
                userId: savedUser._id,
                type: 'expense',
                amount: 50000,
                category: 'Transportasi',
                description: 'Bensin motor',
                date: new Date(new Date().setDate(new Date().getDate() - 1))
            }
        ];

        await Transaction.insertMany(dummyTransactions);
        console.log('Dummy transactions seeded');

        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
