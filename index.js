require('dotenv').config();

const express = require("express");

const session = require("express-session");

let path = require("path");

let bodyParser = require("body-parser");

let app = express();

app.set("view engine", "ejs");


const port = process.env.PORT || 3001;

const knex = require("knex")({
    client: "pg",
    connection: {
        host : process.env.DB_HOST || "localhost",
        user : process.env.DB_USER || "postgres",
        password : process.env.DB_PASSWORD || "admin",
        database : process.env.DB_NAME || "assignment_3",
        port : process.env.DB_PORT || 5432  // PostgreSQL 16 typically uses port 5434
    }
});

app.use(express.urlencoded({extended: true}));

app.get("/", (req, res) => 
    knex.select().from("pokemon")
    .then(pokemon => {
        console.log(`Successfully retrieved ${pokemon.length} pokemon from database`);
        res.render("index", {pokemon: pokemon});
        })
    .catch((err) => {
        console.error("Database query error:", err.message);
        res.render("index", {
            pokemon: [],
            error_message: `Database error: ${err.message}. Please check if the 'pokemon' table exists.`
        });
    })
);;

app.post("/searchedPokemon", (req, res) => {
    const searchName = req.body.name;

    knex.select().from("pokemon").where("description", "ilike", `%${searchName}%`)
    .then(pokemon => {
        console.log(`Successfully retrieved ${pokemon.length} pokemon from database matching '${searchName}'`);
        res.render("searched", {pokemon: pokemon});
    })
    .catch((err) => {
        console.error("Error:", err.message);
        res.render("index", {
            pokemon: [],
            error_message: `Pokemon not found in the list, please try again`
        });
    });
});


app.listen(port, () => {
    console.log("The server is listening");
});