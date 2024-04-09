/****************************************************************************** * 
 * ITE5315 – Project * I declare that this assignment is my own work in accordance with 
 * Humber Academic Policy. * No part of this assignment has been copied manually or electronically
 *  from any other source * (including web sites) or distributed to other students.
 *  * * Group member Name: Abin Mathew , Shoba Merin Kurian
 * _ Student IDs: N01579677 , N01511573 Date: 04-04-2024_ 
 * 
 * ******************************************************************************/
// Import required modules
const express = require("express");
const cors = require("cors");
const { initialize } = require("./config/database");
const restaurantRoutes = require("./routes/restaurantRoutes");
const { engine } = require("express-handlebars");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "public")));


// Set up Handlebars view engine
app.engine(
  ".hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views/layouts"),
    partialsDir: path.join(__dirname, "views/partials"),
  })
);
app.set("view engine", ".hbs");
app.set("views", "./views");


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

initialize(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

app.get("/", (req, res) => {
  res.render("home");
});

module.exports = app;
