var express = require("express");
var cookieParser = require('cookie-parser');
var app = express();
var PORT = 8080;
const bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

var urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};

var users = { 
    "user1ID": {
      id: "user1ID", 
      email: "user1@email.com", 
      password: "password1"
    },
   "user2ID": {
      id: "user2ID", 
      email: "user2@email.com", 
      password: "password2"
    },
    "user3ID": {
        id: "user3ID", 
        email: "user3@email.com", 
        password: "password3"
    },
    "user4ID": {
        id: "user4ID", 
        email: "user4@email.com", 
        password: "password4"
    }
}

app.get("/urls.jason", (req, res) => {
    res.json(urlDatabase);
});

// only one method type for each route you set
app.get("/", (req, res) => {
    res.send("This is the root");
});

// HOME 
app.get("/urls", (req, res) => {
    // render the urlDatabase object data on the index page - old code looking for username we stored on it's own
    // let templateVars = { 
    //     urlDatabase: urlDatabase,
    //     username: req.cookies["username"]
    // };

    // render the urlDatabase object data on the index page - new code passing all user data
    let templateVars = { 
        urlDatabase: urlDatabase,
        user: users[req.cookies["userID"]] //user.email, user.id, user.password
    };
    res.render("urls_index", templateVars);
});

// set us up to create a new one - it's GET becasue we're getting the "paperwork" to fill out
app.get("/urls/new", (req, res) => {
    let templateVars = {user: users[req.cookies["userID"]]};
    res.render("urls_new", templateVars);
});

// this route is for once we have filled out peperwork to create a URL
app.post("/urls", (req, res) => {
    // adds a long url to my database by adding the KEY generateRandomString
    let shortURL = generateRandomString();
    // req.body.longURL  =  looking for the NAME defined in the form
    urlDatabase[shortURL] = req.body.longURL;
    res.redirect('/urls');
});

app.get("/urls/:id", (req, res) => {
    let shortURL = req.params.id;
    let longURL = urlDatabase[shortURL]
    let templateVars = {
        shortURL: shortURL,
        longURL: longURL,
        user: users[req.cookies["userID"]]
    };
    res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/update", (req, res) => {
    // get the value from the form input name=""
    let newURL = req.body.update;
    // update the correct param name (here it's :shortURL) in order to update
    urlDatabase[req.params.shortURL] = newURL
    res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
    let longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
    // Delete the id from the urlDatabase object
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
});

app.post("/login", (req, res) => {
    let email       = req.body.email;
    let password    = req.body.password;
    let user        = findUserByEmail(email);

    if (!user) {
        res.status(403);
        res.send("User does not exist. Please try again.");
        return;
    }

    if (password !== user.password) {
        res.status(403);
        res.send("The password entered does not match. Please try again.");
        return;
    }

    res.cookie("userID", user.id);
    res.redirect('/urls');
});

app.get("/login", (req, res) => {
    let templateVars = {user: users[req.cookies["userID"]]};
    res.render("urls_login", templateVars);
});

app.post("/logout", (req, res) => {
    // clear cookie
    res.clearCookie("userID");
    res.redirect('/urls');
});

app.get("/register", (req, res) => {
    res.render("urls_register");
});

app.post("/register", (req, res) => {
    // get email and password entered in the form
    let email = req.body.email;
    let password = req.body.password;
    let userID =  generateRandomString();

    if (email && password) {
        // email is already taken
        if (findUserByEmail(email)) {
            res.status(400);
            res.send("status 400 - email already exists");
            return; // ends the function
        }
        // email is new so update users database with new userID etc...
        users[userID] = {
            "id": userID,
            'email': email,
            'password': password
        }
        res.cookie("userID", userID);
        res.redirect("/urls");
    } else {
        // no info was entered
        res.status(400);
        res.send("status 400 - no information entered");
    }
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
    let randomString = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 6; i++) {
        randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomString;
};

function findUserByEmail(email) {
    // iterate over all users and compare the new email attempt with all emails stored in the database
    for (let key in users) {
        if (email === users[key].email)
        return users[key];
    }
    return null;
};

