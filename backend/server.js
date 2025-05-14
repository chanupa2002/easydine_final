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

const financeBillRouter = require("./routes/FinanceBills");
app.use("/finance", financeBillRouter)

const financestock = require('./routes/FinanceStock');
app.use('/financestocks', financestock);

const financeOrder = require('./routes/FinanceOrder');
app.use('/financeOrder', financeOrder);

const stockRoute = require('./routes/stockRoute.js') ;
app.use("/api/v1/stock", stockRoute);

const foodItemRoute = require('./routes/foodItemRoute.js');
app.use("/api/v1/food", foodItemRoute);

const FeedbackRouter  = require("./routes/Feedback");
app.use("/Feedback",FeedbackRouter);

const orderRoute = require('./routes/Order');
app.use("/orders", orderRoute);


app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});
