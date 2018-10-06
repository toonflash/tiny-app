var express         = require("express");
var cookieSession   = require('cookie-session')
var app             = express();
var PORT            = 8080;
const bodyParser    = require("body-parser");
const bcrypt        = require('bcrypt');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
    name: 'session',
    keys: ['key'],
}))

var urlDatabase = {
    "b2xVn2": {
        shortURL: "b2xVn2",
        longURL:  "http://www.lighthouselabs.ca",
        userID:   'user1ID'
    },
    "9sm5xK": { 
        shortURL: "b2xVn2",
        longURL:  "http://www.google.com",
        userID:   'user1ID'
    }
};

var users = { 
    "user1ID": {
        id:         "user1ID", 
        email:      "user1@email.com", 
        password:   bcrypt.hashSync("password1", 10)
    },
   "user2ID": {
        id:         "user2ID", 
        email:      "user2@email.com", 
        password:   bcrypt.hashSync("password2", 10)
    },
    "user3ID": {
        id:         "user3ID", 
        email:      "user3@email.com", 
        password:   bcrypt.hashSync("password3", 10)
    },
    "user4ID": {
        id:         "user4ID", 
        email:      "user4@email.com", 
        password:   bcrypt.hashSync("password4", 10)
    }
}

app.get("/urls.jason", (req, res) => {
    res.json(urlDatabase);
});
 

// --------------------------------------- ROOT -----------------------------//

// only one method type for each route you set
app.get("/", (req, res) => {
    if (!users[req.session["userID"]]) {
        res.redirect('/login');
    }

    res.redirect('/urls');
});

// --------------------------------------- HOME -----------------------------//

app.get("/urls", (req, res) => {
    let templateVars = { 
        urlDatabase: urlsForUser(req.session["userID"]),
        user: users[req.session["userID"]] //user.email, user.id, user.password
    };

    res.render("urls_index", templateVars);
});
 
app.post("/urls", (req, res) => {
    let shortURL    = generateRandomString();
    let longURL     = req.body.longURL;

    // adds a long url to my database by adding the KEY generateRandomString
    urlDatabase[shortURL] = {
        shortURL:   shortURL,
        longURL:    longURL,
        userID:     req.session["userID"]
    };

    res.redirect('/urls');
});

// --------------------------------------- NEW SHORT URL -----------------------------//
app.get("/urls/new", (req, res) => {
    // prevent anonymous user from shorting a url
    if (!users[req.session["userID"]]){
        res.redirect("/login");
    }

    let templateVars = {user: users[req.session["userID"]]};
    res.render("urls_new", templateVars);
});


// --------------------------------------- SINGLE SHORT URL PAGE -----------------------------//
app.get("/u/:shortURL", (req, res) => {
    if(req.session["userID"]){
        //checking for the user
        if(urlDatabase[req.params.shortURL]){
            //checking if shortURL is database
            if(urlDatabase[req.params.shortURL].userID === req.session["userID"]){
                // checking if shortURL belongs to logged in user
                let longURL = urlDatabase[req.params.shortURL].longURL;
                res.redirect(longURL);
            } else {
                res.status(403);
                const message = "That shortURL does not belong to you.";
                res.render("urls_error", {message});
            }
        } else {
            res.status(404);
            const message = "That shortURL does not exist.";
            res.render("urls_error", {message});
        }

    } else {
        res.status(403);
        const message = "Please make sure you are logged in.";
        res.render("urls_error", {message});
    }
});


app.get("/urls/:id", (req, res) => {
    let shortURL        = req.params.id;
    let longURL         = urlDatabase[shortURL];
    let templateVars    = {
        shortURL:   shortURL,
        longURL:    longURL,
        user:       users[req.session["userID"]]
    };
    // check to see if short url exists
    if(!longURL){
        res.status(404);
        const message = "That shortURL does not exist.";
        res.render("urls_error", {message});
        return;
    }

    res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/update", (req, res) => {
    // get the value from the form input name="" but account for having to update an OBJECT thus rememeber all the keys/values in the object or else you'll write over them.
    let tempUpdatedData = {
        shortURL:   req.params.shortURL,
        longURL:    req.body.longURL,
        userID:     req.session["userID"]
    };
    
    urlDatabase[req.params.shortURL] = tempUpdatedData;
    res.redirect('/urls');
});


// --------------------------------------- DELETE SHORT URL -----------------------------//

app.post("/urls/:id/delete", (req, res) => {
    // Delete the id from the urlDatabase object
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
});


// --------------------------------------- LOGIN -----------------------------//

app.post("/login", (req, res) => {
    let email       = req.body.email;
    let password    = req.body.password;
    let user        = findUserByEmail(email);

    if (!email || !password) {
        res.status(400);
        const message = "You missed entering some imformation. Please try again.";
        res.render("urls_error", {message});
    }

    if (!user) {
        res.status(403);
        const message = "User does not exist. Please try again.";
        res.render("urls_error", {message});
        return;
    }

    if (!bcrypt.compareSync(password, user.password)) {
        res.status(403);
        const message = "The password entered does not match. Please try again.";
        res.render("urls_error", {message});
        return;
    }

    req.session.userID = user.id;
    res.redirect('/urls');
});

app.get("/login", (req, res) => {
    let templateVars = {user: users[req.session["userID"]]};
    res.render("urls_login", templateVars);
});


// --------------------------------------- LOGOUT -----------------------------//

app.post("/logout", (req, res) => {
    req.session = null;
    res.redirect('/urls');
});

// --------------------------------------- REGISTER -----------------------------//

app.get("/register", (req, res) => {
    res.render("urls_register");
});

app.post("/register", (req, res) => {
    // get email and password entered in the form
    let email               = req.body.email;
    let password            = req.body.password;
    let userID              =  generateRandomString();
    const hashedPassword    = bcrypt.hashSync(password, 10);

    if (email && password) {
        // email is already taken
        if (findUserByEmail(email)) {
            res.status(400);
            const message = "That email already exists. Please try again.";
            res.render("urls_error", {message});
            return; 
        }
        // email is new so update users database with new userID etc...
        users[userID] = {
            "id":       userID,
            'email':    email,
            'password': hashedPassword
        }
        //console.log("hashedPassword", hashedPassword);
        req.session.userID = userID;
        res.redirect("/urls");
    } else {
        // no info was entered
        res.status(400);
        const message = "You missed entering some imformation. Please try again.";
        res.render("urls_error", {message});
    }
});

// --------------------------------------- ERROR -----------------------------//
app.get("/error", (req, res) => {
    const message = "Something has gone wrong.";
    res.render("urls_error", {message});
});



app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
    let randomString    = "";
    var characters      = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

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

function urlsForUser(id) {
    return Object.keys(urlDatabase).filter(shortURL => urlDatabase[shortURL].userID === id).map(url => urlDatabase[url]);
};
