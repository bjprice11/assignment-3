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

// Set the public directory for static files
app.use(
    session(
        {
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
        }
    )
);

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

// sets the public directory for static files
app.use((req, res, next) => {
    // Skip authentication for login routes
    if (req.path === '/' || req.path === '/login' || req.path === '/logout') {
        //continue with the request path
        return next();
    }
    
    // Check if user is logged in for all other routes
    if (req.session.isLoggedIn) {
        //notice no return because nothing below it
        next(); // User is logged in, continue
    } 
    else {
        res.render("login", { error_message: "Please log in to access this page" });
    }
});

// Main page route - notice it checks if they have logged in
app.get("/", (req, res) => {
    if (req.session.isLoggedIn){
    knex.select().from("pokemon") // selects all from the pokemon table
    .orderBy("description", "asc") // orders the pokemon by description in ascending order
    .then(pokemon => {
        console.log(`Successfully retrieved ${pokemon.length} pokemon from database`); // logs to the console the number of pokemon retrieved
        res.render("index", {pokemon: pokemon}); // renders the index.ejs file with the pokemon data
        })
    }
    else {
        res.render("login", { error_message: "" });
    }
 })
;

// View Users route - redirects to users view
app.get("/viewUsers", (req, res) => {
    res.redirect("/users");
});


// Users page route - notice it checks if they have logged in
app.get("/users", (req, res) => {
    if (req.session.isLoggedIn){
    knex.select().from("user") // selects all from the user table
    .then(users => {
        console.log(`Successfully retrieved ${users.length} users from database`); // logs to the console the number of users retrieved
        res.render("users", {users: users, level: req.session.level}
        ); // renders the users.ejs file with the user data
        })
    }
    else {
        res.render("login", { error_message: "" });
    }
 });

 // Logout route - destroys the session and redirects to login
app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
        }
        res.redirect("/login");
    });
});

app.get("/login", (req, res) => {
    // This route is needed to display the login form when a user is redirected 
    // to it (e.g., after logout or due to the middleware blocking access).
    res.render("login", { error_message: "" });
});

// This creates attributes in the session object to keep track of user and if they logged in
app.post("/login", (req, res) => {
    let sName = req.body.username;
    let sPassword = req.body.password;
    let sLevel = req.body.level; // This value comes from the form

    knex.select("username", "password", "level") // Select all fields just to be safe
    .from("user")
    .where("username", sName)
    .andWhere("password", sPassword)
    .andWhere("level", sLevel) // Checks all three
    .then(users => {
      // Check if ANY user was found with that exact combination
      if (users.length > 0) {
        // We found a user. Now, lets set session variables
        req.session.isLoggedIn = true;
        req.session.username = sName;
        req.session.level = sLevel; 
          res.redirect("/");
        } else {
          // Should not happen if your form is correct, but good to have
          res.render("login", { error_message: "Invalid Login." });
        }
      })
    .catch(err => {
      console.error("Login error:", err);
      // Send a generic error to the user
      res.render("login", { error_message: "An error occurred. Please try again." });
    });
});

// Add User route - displays the add user form and handles form submission
app.get("/addUser", (req, res) => {
    if(req.session.isLoggedIn){
    res.render("createUser");
    }
    else {
        res.render("login", { error_message: "" });
    }
});


//creates a new uses in the database
app.post("/addUser", (req, res) => {
    const {username, password, level} = req.body;
    const newUser = {    // builds record with the same structure as the table
        username,
        password,
        level
    };  
    knex("user").insert(newUser) // inserts the new user into the user table
    .then(() => {
        console.log(`Successfully added user '${username}' to database`);
        res.redirect("/users");
    })
});


// Deletes a user from the database
app.post("/deleteUser/:username",  (req, res) => {
    const deleteUser = req.params.username;

    knex("user").where ("username", deleteUser).del() // deletes the user from the user table where the username matches the deleteUser variable
    .then(() => {
        console.log(`Successfully deleted user '${deleteUser}' from database`);
        res.redirect("/users");
    })
});


// Edits a user in the database
app.get("/editUser/:username", (req, res) => {
    const editUsername = req.params.username;
    
    knex.select().from("user").where("username", editUsername) // selects all from the user table where the username matches the editUsername variable
    .first()
    .then(user => {
        if (!user) {
            return res.status(404).render("displayUsers", {
                users: [],
                error_message: "User not found."
            });
        }
        console.log(`Successfully retrieved user '${editUsername}' from database for editing`);
        res.render("editUser", {user: user});
    })

});

// Updates the user in the database
app.post("/editUser/:username", (req, res) => {
    const upUsername = req.params.username
    const { username, password, level } = req.body;
    const updatedUser = {    // builds record with the same structure as the table
        username,
        password,
        level
    };
    knex("user")
        .where({ username: upUsername})
        .update(updatedUser)
        .then((rowsUpdated) => {
            if (rowsUpdated === 0) {
                return res.status(404).render("displayUsers", {
                    users: [],
                    error_message: "User not found."
                });
            }
            res.redirect("/users");
    })
    .catch((err) => { // catches any errors
        console.error("Error:", err.message);
        res.render("editUser", {
            user: {username: username, password: password, level: level},
            error_message: "Error updating user. Please try again."
        });
    });
});

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