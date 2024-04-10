/****************************************************************************** * 
 * ITE5315 – Project * I declare that this assignment is my own work in accordance with 
 * Humber Academic Policy. * No part of this assignment has been copied manually or electronically
 *  from any other source * (including web sites) or distributed to other students.
 *  * * Group member Name: Abin Mathew , Shoba Merin Kurian
 * _ Student IDs: N01579677 , N01511573 Date: 04-04-2024_ 
 * 
 * ******************************************************************************/
// Import required modules
const express = require('express');
const cors = require('cors');
const { initialize } = require('./config/database');
const restaurantRoutes = require('./routes/restaurantRoutes');
const dotenv = require('dotenv');
const path = require('path');
const app = express();

const exphbs = require('express-handlebars');
dotenv.config();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'handlebars');

app.use(express.static(path.join(__dirname, "public")));
// Set Handlebars as the view engine
app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

initialize(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

app.use('/api/restaurants', restaurantRoutes);

module.exports = app;
