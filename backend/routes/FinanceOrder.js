const router = require("express").Router();

let FinanceOrder = require("../models/FinanceOrder");

router.get('/', async (req, res) => {
    try {
        const orders = await FinanceOrder.find(); 
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post("/add", (req, res) => {
    try {
        const { orderId, total, dateTime } = req.body;

        const newFinanceOrder = new FinanceOrder({
            orderId,
            total,
            dateTime 
        });

        newFinanceOrder.save()
            .then(() => {
                res.status(201).json({ message: "FinanceOrder added successfully" });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Error saving FinanceOrder" });
            });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error adding FinanceOrder" });
    }
});


router.get("/all", (req, res) => {
    FinanceOrder.find()
        .then((FinanceOrder) => {
            res.status(200).json(FinanceOrder);  // Send all FinanceOrder records
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error fetching FinanceOrder" });
        });
});


router.get("/:id", (req, res) => {
    FinanceOrder.findById(req.params.id)
        .then((FinanceOrder) => {
            if (!FinanceOrder) {
                return res.status(404).json({ message: "FinanceOrder not found" });
            }
            res.status(200).json(FinanceOrder);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error fetching FinanceOrder" });
        });
});

module.exports = router;


