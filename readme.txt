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
     from personDB.js).
   - start personDB from console ( node personDB.js ).
   - open browser and go to http://localhost:4242 to find the static index page.
   
   I provide jQueries in a separate file. Use console to execute queries.
   Remember to check person id from query when updating or fetching a single
   person by id. They are not static.
  
   Anyway, this was all new to me, be patient and gentle with the review!
   
*/