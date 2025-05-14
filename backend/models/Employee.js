const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const EmployeeSchema = new mongoose.Schema({ 
    name: { type: String, required: true },
    contactNo: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    designation: { type: String, required: true },
    salary: { type: Number, required: true },
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const employee = mongoose.model("employee", EmployeeSchema);  
module.exports = employee;