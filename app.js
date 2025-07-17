const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require("cors");
const app = express();
const port = 3000;
const {connectDB} = require('./DB.js');
const authRoute = require('./routes/authRoutes.js')
const cpRoute = require('./routes/cpRoutes.js')
const chefRoute = require('./routes/chefRoutes.js')
const scoutRoute = require('./routes/scoutRoutes.js')

// CORS middleware (must be before routes)
app.use(cors({
    origin: 'http://localhost:5173', // <-- Change to your frontend's URL/port
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());

app.use('/Chef', chefRoute);
app.use('/CP', cpRoute);
app.use('/Scout', scoutRoute);
app.use('/authen', authRoute);

app.listen(port,'0.0.0.0', () => {
  connectDB();
  console.log(`Server is running on port ${port}`);
});

