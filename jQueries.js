/* these queries can be tested via the browser console @ /public_html/index.html.
 *
 * NOTE!!! You must use a valid person id to fetch individual persons and update
 * them. You can get all person id:s by getting all persons first. ID:s supplied
 * here are just for syntax reference.
 *
*/

// check if the api is up
jQuery.get("/api/", function(data, textStatus, jqXHR) {
    console.log(data);
});

// get all persons in database
jQuery.get("/api/persons/", function(data, textStatus, jqXHR) {
    console.log("Get response:");
    console.dir(data);
    console.log(textStatus);
    console.dir(jqXHR);
});

// get a person by id (54f6b44ee242c95007cdf0c3)
jQuery.get("/api/persons/54f6b44ee242c95007cdf0c3",
    function (data, textStatus, jqXHR) {
    console.log("Get response:");
    console.dir(data);
    console.log(textStatus);
    console.dir(jqXHR);
});

// create a valid person Sami Vaittinen
jQuery.post("/api/persons/", {
    "name" : {"firstName": "Sami", "lastName": "Vaittinen"},
    "email": "sami.vaittinen@gmail.com",
    "ssn"  : "271173-0890",
}, function(data, textStatus, jqXHR) {
    console.log("Get response:");
    console.dir(data);
    console.log(textStatus);
    console.dir(jqXHR);
});

// update a person (also demonstrates name and email formatting)
jQuery.ajax({
    url: "/api/persons/54f7593f9d56e910076bb033",
    type: "PUT",
    data: {
    "name" : {"firstName": "     sami-tApio", "lastName": "Vaittinen-Äikäs"},
    "email": "sami.vaiTTinen@animania.fi",
    "ssn"  : " 271173-0890 ",
    },
    success: function(data, textStatus, jqXHR) {
        console.log("PUT response:");
        console.dir(data);
        console.log(textStatus);
        console.dir(jqXHR);
    }
});

// delete a person by id 
jQuery.ajax({url: "/api/persons/54f6cbacd4424d9c07c46d32",
             type: "DELETE",
             success: function(data, textStatus, jqXHR) { console.dir(data); }
});