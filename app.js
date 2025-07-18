const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require("cors");
const app = express();
const port =(process.env.PORT||3000);
const {connectDB} = require('./DB.js');
const authRoute = require('./routes/authRoutes.js')
const cpRoute = require('./routes/cpRoutes.js')
const chefRoute = require('./routes/chefRoutes.js')
const scoutRoute = require('./routes/scoutRoutes.js')
const Land = require('./modules/Land_module.js')

// CORS middleware (must be before routes)
app.use(cors({
    origin:"https://clash-of-patrols.vercel.app/", // <-- Change to your frontend's URL/port
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

app.get('/',async (req,res) => {
  try{
  let land = await Land.findOne({land_no : 1}).exec()
  res.status(200).send(land)
  }catch(err){
    console.log(err)
    return res.status(500).send({"error":err.messsage})
  }
})

app.use('/Chef', chefRoute);
app.use('/CP', cpRoute);
app.use('/Scout', scoutRoute);
app.use('/authen', authRoute);

app.listen(port,'0.0.0.0', () => {
  connectDB();
  console.log(`Server is running on port ${port}`);
});

