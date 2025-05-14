const router = require("express").Router();

let Feedback = require("../models/Feedback");


router.post("/add", (req, res) => {
    try {
        const { customerName, orderId, rating, feedback} = req.body;

        const newFeedback = new Feedback({
            customerName,
            orderId,
            rating,
            feedback
        });

        newFeedback.save()
            .then(() => {
                res.status(201).json({ message: "Feedback added successfully" });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Error saving feedback" });
            });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error adding feedback" });
    }
});


router.get("/all", (req, res) => {
    Feedback.find()
        .then((feedbacks) => {
            res.status(200).json(feedbacks);  // Send all employee records
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error fetching feedbacks" });
        });
});


router.get("/:id", (req, res) => {
    Feedback.findById(req.params.id) // Changed Employee -> Feedback
        .then((feedback) => {
            if (!feedback) {
                return res.status(404).json({ message: "Feedback not found" });
            }
            res.status(200).json(feedback);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error fetching feedback" });
        });
});

router.put("/update/:id", (req, res) => {
    const { id } = req.params; // Get the feedback ID from URL params
    const updatedFeedback = req.body; // Get the updated feedback data from the request body

    // Find and update the feedback by ID
    Feedback.findByIdAndUpdate(id, updatedFeedback, { new: true })
        .then((feedback) => {
            if (!feedback) {
                return res.status(404).json({ message: "Feedback not found" });
            }
            res.status(200).json(feedback); // Respond with the updated feedback
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error updating feedback" });
        });
});


router.delete("/delete/:id", (req, res) => {
    const { id } = req.params; // Get the feedback ID from URL params

    // Find and delete the feedback by ID
    Feedback.findByIdAndDelete(id)
        .then((deletedFeedback) => {
            if (!deletedFeedback) {
                return res.status(404).json({ message: "Feedback not found" });
            }
            res.status(200).json({ message: "Feedback deleted successfully" }); // Respond with success message
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error deleting feedback" });
        });
});



module.exports = router;

