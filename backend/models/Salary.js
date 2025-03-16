const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const SalarySchema = new mongoose.Schema({ 
    empId: { type: String, required: true },
    month: { type: String, required: true},
    salary: { type: Number, required: true },
    dateTime: { type: Date, default: Date.now }
});

const salary = mongoose.model("salary", SalarySchema);
module.exports = salary;