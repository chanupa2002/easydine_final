const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();

dotenv.config();

const PORT = process.env.PORT || 8070;

app.use(cors());
app.use(bodyParser.json());

const URL = process.env.MONGODB_URL;

if (!URL) {
    console.error("MongoDB URL is not defined in the environment variables.");
    process.exit(1);
}

mongoose.connect(URL, { 
    
})
.then(() => console.log("MongoDB Connection success!"))
.catch((err) => console.error("MongoDB Connection failed:", err));

const employeeRouter  = require("./routes/Employee");
app.use("/employee",employeeRouter);

const salaryRouter  = require("./routes/Salary");
app.use("/salary",salaryRouter);



app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});
