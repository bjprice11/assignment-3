// Brandon Price
// This is the maine file for the Pokemon search application
// This application allows users to search for Pokemon by description from a PostgreSQL database
require('dotenv').config();
// Connect to required library express
const express = require("express");
// Connect to required library express-session
const session = require("express-session");
// Connect to required library path
let path = require("path");
// Connect to required library body-parser
let bodyParser = require("body-parser");
// Create an instance of express to work as the application
let app = express();
// Set the views directory
app.set("view engine", "ejs");

// Set the port to port 3001 or the environment port
const port = process.env.PORT || 3001;

// connects to the pgadmin database where the pokemon are stored
const knex = require("knex")({
    client: "pg",
    connection: {
        host : process.env.DB_HOST || "localhost",
        user : process.env.DB_USER || "postgres",
        password : process.env.DB_PASSWORD || "admin",
        database : process.env.DB_NAME || "assignment_3",
        port : process.env.DB_PORT || 5432 
    }
});

// sets so all of the data is set into an array
app.use(express.urlencoded({extended: true}));

// sets the index.ejs file to be the main page
app.get("/", (req, res) => 
    knex.select().from("pokemon") // selects all from the pokemon table
    .orderBy("description", "asc") // orders the pokemon by description in ascending order
    .then(pokemon => {
        console.log(`Successfully retrieved ${pokemon.length} pokemon from database`); // logs to the console the number of pokemon retrieved
        res.render("index", {pokemon: pokemon}); // renders the index.ejs file with the pokemon data
        })
    .catch((err) => { // catches any errors
        console.error("Database query error:", err.message);
        res.render("index", {
            pokemon: [],
            error_message: `Database error: ${err.message}. Please check if the 'pokemon' table exists.`
        });
    })
);;

// sets the searchedPokemon.ejs file to be the page that shows the search results
app.post("/searchedPokemon", (req, res) => {
    const searchName = req.body.name;// gets the name from the form input

    knex.select().from("pokemon").where("description", "ilike", `%${searchName}%`) // selects all from the pokemon table where the description matches the search name
    .then(pokemon => {
        console.log(`Successfully retrieved ${pokemon.length} pokemon from database matching '${searchName}'`);
        res.render("searched", {pokemon: pokemon});
    })
    .catch((err) => { // catches any errors
        console.error("Error:", err.message);
        res.render("index", {
            pokemon: [],
            error_message: `Pokemon not found in the list, please try again`
        });
    });
});

//starts the server on the specified port
app.listen(port, () => {
    console.log("The server is listening");
});