const router = require("express").Router();

let Salary = require("../models/Salary");


router.post("/add", (req, res) => {
    try {
        const { empId, month, salary, dateTime} = req.body;

        const newSalary = new Salary({
            empId,
            month,
            salary,
            dateTime,
        });

        newSalary.save()
            .then(() => {
                res.status(201).json({ message: "Salary added successfully" });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Error saving salary" });
            });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error adding salary" });
    }
});


router.get("/all", (req, res) => {
    Salary.find()
        .then((salaries) => {
            res.status(200).json(salaries);  // Send all salary records
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error fetching salaries" });
        });
});


router.get("/:id", (req, res) => {
    Salary.findById(req.params.id)
        .then((salary) => {
            if (!salary) {
                return res.status(404).json({ message: "Salary not found" });
            }
            res.status(200).json(salary);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error fetching salary" });
        });
});


router.put("/update/:id", (req, res) => {
    try {
        const { empId, month, salary, dateTime} = req.body;

        Salary.findByIdAndUpdate(req.params.id, 
            { empId, month, salary, dateTime},
            { new: true }) // Returns the updated document
            .then((updatedSalary) => {
                if (!updatedSalary) {
                    return res.status(404).json({ message: "Salary not found" });
                }
                res.status(200).json({ message: "Salary updated successfully", updatedSalary });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Error updating salary" });
            });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error updating salary" });
    }
});


router.delete("/delete/:id", (req, res) => {
    try {
        Salary.findByIdAndDelete(req.params.id)
            .then((deletedSalary) => {
                if (!deletedSalary) {
                    return res.status(404).json({ message: "Salary not found" });
                }
                res.status(200).json({ message: "Salary deleted successfully" });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Error deleting salary" });
            });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error deleting salary" });
    }
});



module.exports = router;


