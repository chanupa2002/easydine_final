const express = require('express');
const router = express.Router();
const financestock = require('../models/FinanceStock');

router.get('/', async (req, res) => {
    try {
        const stocks = await financestock.find();
        res.json(stocks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;