const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

mongoose.connect('mongodb://localhost:27017/transactions', { useNewUrlParser: true, useUnifiedTopology: true });

const transactionSchema = new mongoose.Schema({
    id: Number,
    title: String,
    description: String,
    price: Number,
    dateOfSale: Date,
    sold: Boolean,
    category: String
});

const Transaction = mongoose.model('Transaction', transactionSchema);

app.use(express.json());

app.get('/initialize', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        await Transaction.insertMany(response.data);
        res.status(200).send('Database initialized with seed data.');
    } catch (error) {
        res.status(500).send('Error initializing database.');
    }
});

app.get('/transactions', async (req, res) => {
    const { month, page = 1, perPage = 10, search = '' } = req.query;
    const regex = new RegExp(search, 'i');
    const startDate = new Date(`2022-${month}-01`);
    const endDate = new Date(`2022-${Number(month) + 1}-01`);
    try {
        const transactions = await Transaction.find({
            dateOfSale: { $gte: startDate, $lt: endDate },
            $or: [
                { title: regex },
                { description: regex },
                { price: regex }
            ]
        }).skip((page - 1) * perPage).limit(Number(perPage));
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).send('Error fetching transactions.');
    }
});

app.get('/statistics', async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`2022-${month}-01`);
    const endDate = new Date(`2022-${Number(month) + 1}-01`);
    try {
        const totalSale = await Transaction.aggregate([
            { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
            { $group: { _id: null, totalAmount: { $sum: '$price' }, totalSoldItems: { $sum: { $cond: ['$sold', 1, 0] } }, totalNotSoldItems: { $sum: { $cond: ['$sold', 0, 1] } } } }
        ]);
        res.status(200).json(totalSale[0]);
    } catch (error) {
        res.status(500).send('Error fetching statistics.');
    }
});

app.get('/barchart', async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`2022-${month}-01`);
    const endDate = new Date(`2022-${Number(month) + 1}-01`);
    try {
        const priceRanges = [
            { range: '0-100', min: 0, max: 100 },
            { range: '101-200', min: 101, max: 200 },
            { range: '201-300', min: 201, max: 300 },
            { range: '301-400', min: 301, max: 400 },
            { range: '401-500', min: 401, max: 500 },
            { range: '501-600', min: 501, max: 600 },
            { range: '601-700', min: 601, max: 700 },
            { range: '701-800', min: 701, max: 800 },
            { range: '801-900', min: 801, max: 900 },
            { range: '901-above', min: 901, max: Infinity }
        ];
        const barchartData = await Promise.all(priceRanges.map(async ({ range, min, max }) => {
            const count = await Transaction.countDocuments({
                dateOfSale: { $gte: startDate, $lt: endDate },
                price: { $gte: min, $lt: max }
            });
            return { range, count };
        }));
        res.status(200).json(barchartData);
    } catch (error) {
        res.status(500).send('Error fetching bar chart data.');
    }
});

app.get('/piechart', async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`2022-${month}-01`);
    const endDate = new Date(`2022-${Number(month) + 1}-01`);
    try {
        const piechartData = await Transaction.aggregate([
            { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        res.status(200).json(piechartData);
    } catch (error) {
        res.status(500).send('Error fetching pie chart data.');
    }
});

app.get('/combined', async (req, res) => {
    try {
        const [transactions, statistics, barchart, piechart] = await Promise.all([
            axios.get(`${req.protocol}://${req.get('host')}/transactions`, { params: req.query }),
            axios.get(`${req.protocol}://${req.get('host')}/statistics`, { params: req.query }),
            axios.get(`${req.protocol}://${req.get('host')}/barchart`, { params: req.query }),
            axios.get(`${req.protocol}://${req.get('host')}/piechart`, { params: req.query })
        ]);
        res.status(200).json({
            transactions: transactions.data,
            statistics: statistics.data,
            barchart: barchart.data,
            piechart: piechart.data
        });
    } catch (error) {
        res.status(500).send('Error fetching combined data.');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
