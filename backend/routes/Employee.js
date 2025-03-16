const router = require("express").Router();

let Employee = require("../models/Employee");


router.post("/add", (req, res) => {
    try {
        const { name, contactNo, email, designation, salary, userName, password } = req.body;

        const newEmployee = new Employee({
            name,
            contactNo,
            email,
            designation,
            salary,
            userName,
            password  
        });

        newEmployee.save()
            .then(() => {
                res.status(201).json({ message: "Employee added successfully" });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Error saving employee" });
            });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error adding employee" });
    }
});


router.get("/all", (req, res) => {
    Employee.find()
        .then((employees) => {
            res.status(200).json(employees);  // Send all employee records
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error fetching employees" });
        });
});


router.get("/:id", (req, res) => {
    Employee.findById(req.params.id)
        .then((employee) => {
            if (!employee) {
                return res.status(404).json({ message: "Employee not found" });
            }
            res.status(200).json(employee);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error fetching employee" });
        });
});


router.put("/update/:id", (req, res) => {
    try {
        const { name, contactNo, email, designation, salary, userName, password } = req.body;

        Employee.findByIdAndUpdate(req.params.id, 
            { name, contactNo, email, designation, salary, userName, password },
            { new: true }) // Returns the updated document
            .then((updatedEmployee) => {
                if (!updatedEmployee) {
                    return res.status(404).json({ message: "Employee not found" });
                }
                res.status(200).json({ message: "Employee updated successfully", updatedEmployee });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Error updating employee" });
            });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error updating employee" });
    }
});


router.delete("/delete/:id", (req, res) => {
    try {
        Employee.findByIdAndDelete(req.params.id)
            .then((deletedEmployee) => {
                if (!deletedEmployee) {
                    return res.status(404).json({ message: "Employee not found" });
                }
                res.status(200).json({ message: "Employee deleted successfully" });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Error deleting employee" });
            });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error deleting employee" });
    }
});



module.exports = router;


