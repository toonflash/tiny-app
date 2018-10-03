var express = require("express");
var app = express();
var PORT = 8080;
const bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};

// only one method type for each route you set
app.get("/", (req, res) => {
    res.send("This is the root");
});

// get all the urls
app.get("/urls", (req, res) => {
    // render the urlDatabase object data on the index page
    res.render("urls_index", {urlDatabase: urlDatabase});
});

// set us up to create a new one - it's GET becasue we're getting the "paperwork" to fill out
app.get("/urls/new", (req, res) => {
    res.render("urls_new");
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
        longURL: longURL
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
}

// for when we handle errors
// if (req.params.id == undefined || req.params.shortURL == undefined) {
//     console.log("Please make sure you are entering a url and try again.");
// return false;
// };

