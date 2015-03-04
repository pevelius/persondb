/*
   Person Database homework for Summer@Vincity 2015
   Sami Vaittinen
   sami.vaittinen@gmail.com
   040-7131560
  
   This is my first ever:
    - intro to node.js
    - intro to mongoDB
    - intro to REST
    - just about the first intro to anything else involved
  
   About the implementation:
   - Console is the main output channel for all information.
   - Validation is done in middleware before saving.
   - There is no custom error handling for duplicate entries, but the db will
     not allow duplicate emails (case insensitive) or social security numbers
     (ssn).
     If you try to save a duplicate of either, an error is logged to console,
     but not on the Ajax query response.
   - Since birthday can be created from ssn, there is no need to save it to db.
     Instead, I provide a virtual getter for it.
   - Persons could be indexed by ssn, but I decided that you can also update
     ssn, so using db-generated id is the way to go.
   - I don't check the sex from ssn. That would be quite hard anyway, since it
     would be necessary to compare it to firstName, since there is no sex
     attribute.
    
   How to test?
   - Fire up MongoDB on localhost or somewhere else (and change server settings
     from below).
   - start personDB from console ( node personDB.js ).
   - open browser and go to http://localhost:4242 to find the static index page.
   
   I provide jQueries in a separate file. Use console to execute queries.
   Remember to check person id from query when updating or fetching a single
   person by id. They are not static.
  
   Anyway, this was all new to me, be patient and gentle with the review!
   
*/

var mongoose   = require("mongoose");
var express    = require("express");
var bodyParser = require("body-parser");


// server settings
var mongodb = "mongodb://localhost:27017/personDB";
var httpServerPort = 4242;

// ------------------------------------------------
// MONGOOSE SECTION STARTS HERE
// ------------------------------------------------

/* Since birthday can be obtained from social security number, we don't have to
 * store it separately to the database. */
var personSchema = new mongoose.Schema({
    name: {firstName: {type: String, required: true, trim: true, set: setName},
           lastName:  {type: String, required: true, trim: true, set: setName}},
    email:            {type: String, required: true, trim: true, set: setEmail, unique: true},
    ssn:              {type: String, required: true, trim: true, set: setSSN ,  unique: true}
});

// virtual getter for birthday (returns array {year: y, month: m, day: d} )
personSchema.virtual('bday').get(function () {
    return makeIntDateFromSsn(this.ssn);
});

// create model of person for database
var PersonModel = mongoose.model("Person", personSchema);

// MONGOOSE VALIDATION FUNCTIONS (CALLED ONE BY ONE BY MIDDLEWARE VALIDATOR)

// First remove all whitespace.
// 2-40 letters, possible dash between (Juha-Matti Siro-Kaunisto etc), i=ignore case
// Foreign letters are not accepted for simplicity.
function validateName (v) {
    var pattern = /^[a-z,åäö]{1,20}[-]{0,1}[a-z,åäö]{1,20}$/i
    if (!pattern.test(v.trim()))
        return false;
    else
        return true;
}

// validate with a regex, which covers most emails. It does not check that the
// country code is a real one.
// This one is dug from the depths of the intarweb, so I have not verified it, nor
// tested it.
function validateEmail (v) {
    var pattern = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|museum)\b/i
    if (!pattern.test(v))
        return false;
    else
        return true;
}

// validation of Finnish social security number (by me)
// Date is checked with a funky way, but I think this approach works because of
// the way the Date() constructor seems to be implemented.
function validateFinnishSSN (v) {
    v = v.trim();
    // check structure of ssn with regex first
    var pattern = /^[0-9]{6}[+-A][0-9]{3}[0123456789ABCDEFHJKLMNPRSTUVWXY]$/i;
    if (!pattern.test(v))
        return false;

    // check that the date is valid.
    var intDate = makeIntDateFromSsn(v); 
    var date = new Date(intDate.year, intDate.month, intDate.day);
    if (date.getFullYear() != intDate.year||
        date.getMonth() != intDate.month ||
        date.getDate() != intDate.day) {
        return false;
    }

    // check that the last character is valid
    var checksumstring = "0123456789ABCDEFHJKLMNPRSTUVWXY";
    var numberstring = v.substring(0, 6) + v.substring(7,10);
    var checksum = parseInt(numberstring) % 31;
    if (v.charAt(10) == checksumstring.charAt(checksum))
        return true;
    else
        return false;
}

// Helper function to convert Finnish social security number to int values of
// year, month and day.
function makeIntDateFromSsn (ssn) {
    var c = ssn.charAt(6);
    var y = 1800;
    if (c == '-')
        y += 100
    else if (c == 'A')
        y += 200;
    y += parseInt(ssn.substring(4, 6));
    var m = parseInt(ssn.substring(2, 4)) - 1;
    var d = parseInt(ssn.substring(0, 2));
    return {year: y, month: m, day: d};
}

// MONGOOSE MIDDLEWARE VALIDATOR

// Do all validations in middleware
PersonModel.schema.pre("save", function(next) {
    if (!validateName(this.name.firstName))
        next(new Error("Illegal name.firstName"));
    if (!validateName(this.name.lastName))
        next(new Error("Illegal name.lastName"));
    if (!validateEmail(this.email))
        next(new Error("Illegal email"));
    if (!validateFinnishSSN(this.ssn))
        next(new Error("Illegal ssn"));
    // all checks passed
    next(null);
});

// MONGOOSE VALIDATORS END HERE

// MONGOOSE SETTERS AND GETTERS START HERE

// First, get rid of empty space in the beginning and in the end.
// Then Format name so that it begins with capital and the rest is lowerCase.
// This takes care of names with a dash, too.
function setName(v) {
    v = v.trim();
    var name = "";
    var parts = v.split('-');
    for (i = 0 ; i < parts.length ; ++i) {
        name += parts[i].charAt(0).toUpperCase() + parts[i].slice(1).toLowerCase() + '-';
    }
    return name.substring (0, name.length - 1);
}

// emails are stored in lowerCase only, since they are unique here.
function setEmail(v) {
    return v.toLowerCase();
}

// ssn is stored in upperCase only, since they are unique.
function setSSN (v) {
    return v.toUpperCase();
}

// MONGOOSE SETTERS AND GETTERS END HERE

// set up the database
mongoose.connect(mongodb);

var database = mongoose.connection;
database.on("error", console.error.bind(console, "connection error: "));
database.once("open", function (callback) {
    // database connection open, do stuff if needed.
});

// ------------------------------------------------
// MONGOOSE SECTION ENDS HERE
// ------------------------------------------------

// HIRE ME!!! (brainwashing-part)

// ------------------------------------------------
// EXPRESS SECTION STARTS HERE
// ------------------------------------------------

// create express app
var app = express();

// use public_html as folder for static content
app.use(express.static("public_html"));
// use body parser to get data from REST api POST queries etc.
// extended: true means that nested entries will be handled correctly.
// Note: Some people seem to say that the body-parser is insecure.
app.use(bodyParser.urlencoded({extended: true}));

// ------------------------------------------------
// REST-API DEFINITION STARTS HERE
// ------------------------------------------------

// to check if the api is up
app.get("/api", function (req, res) {
    return res.send(true);
});

// log a person to console to demonstrate value retrieval from database.
// since month is stored in Date() -form (0-11), add one to it.
function logPerson(p) {
    console.log("id   : " + p.id);
    console.log("name : " + p.name.firstName + " " + p.name.lastName);
    console.log("email: " + p.email);
    console.log("ssn  : " + p.ssn);
    console.log("bday : " + p.bday.day + "." + (p.bday.month + 1) + "." + p.bday.year);
}

// get all persons in database
app.get("/api/persons", function (req, res) {
    PersonModel.find(function (err, persons) {
        if (!err) {
            console.log("Persons in database:");
            for (i = 0 ; i < persons.length ; ++i) {
                logPerson(persons[i]);
            }
            return res.send(persons);
        }
        else {
            return console.log(err);
        }
    });
});

// get a single person in database by id
app.get("/api/persons/:id", function (req, res) {
    return PersonModel.findById(req.params.id, function (err, person) {
        if (person == null) {
            console.log("Unknown person id");
            return res.send("");
        }
        if (!err) {
            logPerson(person);
            return res.send(person);
        }
        else {
            return console.log(err);
        }
    });
});

// add a person to database
app.post("/api/persons", function (req, res) {
    var person;
    console.log("POST: ");
    console.log(req.body);
    person = new PersonModel({
        name: req.body.name,
        email: req.body.email,
        ssn: req.body.ssn,
    });
    person.save(function(err) {
        if (!err) {
            return console.log("Person created");
        }
        else {
            return console.log(err);
        }
    });
    return res.send(person);
});

// update a person (by id)
app.put("/api/persons/:id", function (req, res) {
    return PersonModel.findById(req.params.id, function (err, person) {
        if (person == null) {
            console.log("Unknown person id");
            return res.send("");
        }
        person.name = req.body.name;
        person.email = req.body.email;
        person.ssn = req.body.ssn;
        return person.save(function (err) {
            if (!err) {
                console.log("Person updated");
            }
            else {
                console.log(err);
            }
            return res.send(person);
        });
    });
});

// delete a person (by id)
app.delete("/api/persons/:id", function (req, res) {
    return PersonModel.findById(req.params.id, function (err, person) {
        if (person == null) {
            console.log("Unknown person id");
            return res.send("");
        }
        return person.remove(function (err) {
            if (!err) {
                console.log("Person removed.");
                return res.send("");
            }
            else {
                console.log(err);
            }
        });
    });
});

// ------------------------------------------------
// REST-API DEFINITION ENDS HERE
// ------------------------------------------------

// create server
var server = app.listen(httpServerPort, function () {
    
    var host = server.address().address;
    var port = server.address().port;
    
    console.log("Created server on http://%s:%s", host, port);
});

// ------------------------------------------------
// EXPRESS SECTION ENDS HERE
// ------------------------------------------------

// thx for the assignment, it was fun to do!