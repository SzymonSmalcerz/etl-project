// Load libraries and frameworks
var express = require("express");
var bodyParser = require("body-parser");
var webscrapper = require("./webscrapper/webscrapper");
var movieKeyFunctions = require("./database/functions/movieKeyFunctions");
const hbs = require('hbs');
const path = require('path');

// initialize express variable
var app = express();
// tell express to use body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '/public')
const viewsPath = path.join(__dirname, '/templates/views')
const partialsPath = path.join(__dirname, '/templates/partials')

// Setup handlebars engine
app.set('view engine', 'hbs')
// Register paths to express - this step lets us use all of files in this folders
// Set views location - thanks to this view engine knows where
// to find dynamic html templates
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)
// Setup static directory to serve -we can use all
// of files in this folder as if they were in main folder
app.use(express.static(publicDirectoryPath))

// define variable used to manage state of application
// variable hold last state that was processed
// there will be 3 states - "E" "T" "L", and calls to api
// must be exactly in this order, by default we set state of our application on "L"
var currentState = "L";

// variable holds last keys entered into "E" state
var lastKeysEntered = "";

// variables holds last titles fetched from lastKeysEntered
var titlesText = "";

// function used to return error messege when something went wrong
function returnErrorMsg(res, errorMsg) {
  return res.status(200).json({
    "error" : errorMsg
  });
};

// route used to process whole etl proces at once
app.post("/etl", async (req, res) => {
  if(currentState == "E" || currentState == "L") {
    if(req.body != null && req.body.movieKeys != null) {
      // process E step
      webscrapper.getMovieHrefs(req.body.movieKeys, (movieKey) => {
        // ERROR - CALLBACK called when error occured during extracting
        return returnErrorMsg(res, "Movies for key " + movieKey + " not found");
      }, async (numOfExtrElements, titles) => {
        // AFTER SUCCESSFUL EXTRACT - CALLBACK called when keys were successfuly extracted
        console.log("after e");
        lastKeysEntered = req.body.movieKeys;
        // pocess T step
        var result = await movieKeyFunctions.transform(lastKeysEntered)
        if(result.error) {
          return returnErrorMsg(res, "Unexpected error: " + result.error);
        }
        // process L step
        console.log("after t");
        result = await movieKeyFunctions.load(lastKeysEntered);
        if(result.error) {
          return returnErrorMsg(res, "Unexpected error: " + result.error);
        }
        console.log("after l");
        console.log("_____________________");
        // create titles response
        titlesText = titles.join(" | ");
        if(titlesText.length > 200) {
          titlesText = titlesText.slice(0, 197) + "...";
        }
        // return successfull response
        res.status(200).json({
          message : "Success, number of extracted/transform/loaded elements: " + numOfExtrElements + ",\nFull ETL process ended\nFetched entities(" + titles.length + "): " + titlesText
        });
      });
    } else {
      return returnErrorMsg(res, "You must provide non empty movie key");
    }
  } else {
    returnErrorMsg(res,
    "Non proper state for that call (N(E ... -> E) [ N >= 1 ] -> T -> L -> E -> ...)");
  }
});

// EXTRACT step
app.post("/e", async (req, res) => {
  if(currentState == "E" || currentState == "L") {
    if(req.body != null && req.body.movieKeys != null) {
      webscrapper.getMovieHrefs(req.body.movieKeys, (movieKey) => {
        // ERROR - CALLBACK called when error occured during extracting
        return returnErrorMsg(res, "Movies for key " + movieKey + " not found");
      }, (numOfExtrElements, titles) => {
        // AFTER SUCCESSFUL EXTRACT - CALLBACK called when keys were successfuly extracted
        // change current state
        currentState = "E";
        // set static variables lastKeysEntered and titlesText
        lastKeysEntered = req.body.movieKeys;
        titlesText = titles.join(" | ");
        if(titlesText.length > 200) {
          titlesText = titlesText.slice(0, 197) + "...";
        }
        // return successfull message
        res.status(200).json({
          message : "Success, number of extracted elements: "
          + numOfExtrElements + ",\nFetched entities (" + titles.length + "): " + titlesText
        });
      });
    } else {
      return returnErrorMsg(res, "You must provide non empty movie key");
    }
  } else {
    returnErrorMsg(res,
      "Non proper state for that call (N(E ... -> E) [ N >= 1 ] -> T -> L -> E -> ...)");
  }
});

// TRANSFORM step
app.post("/t", async(req, res) => {
  if(currentState == "E") {
    var result = await movieKeyFunctions.transform(lastKeysEntered);
    if(result.error) {
      // ERROR - CALLBACK called when error occured during transforming
      return returnErrorMsg(res, "Unexpected error: " + result.error);
    }
    // AFTER SUCCESSFUL TRANSFORM - change application state
    currentState = "T";
    // return success response
    res.json({
      message : "Success, number of transformed movie keys: "
      + result.numOfTransformedElements + ",\nData transformed for entities: " + titlesText
    });
  } else {
    return returnErrorMsg(res,
      "Non proper state for that call (N(E ... -> E) [ N >= 1 ] -> T -> L -> E -> ...)");
  }
});

// LOAD step
app.post("/l", async(req, res) => {
  if(currentState == "T") {
    var result = await movieKeyFunctions.load(lastKeysEntered);
    if(result.error) {
      // ERROR - CALLBACK called when error occured during loading
      return returnErrorMsg(res, "Unexpected error: " + result.error);
    }
    // AFTER SUCCESSFUL LOAD - change application state
    currentState = "L";
    // return success response
    res.json({
      message : "Success, number of loadedElements: " +
      result.numOfLoadedElements + ",\nData loaded for entities: " + titlesText
    });
  } else {
    return returnErrorMsg(res,
      "Non proper state for that call (N(E ... -> E) [ N >= 1 ] -> T -> L -> E -> ...)");
  }
});

// get current state of application
app.get("/state", (req, res) => {
  res.json({
    currentState,
    lastKeysEntered
  });
});

// drop whole data from database
app.get("/dropDB", async (req, res) => {
  try {
    await movieKeyFunctions.dropMovieKeyData();
    // after dropping data redirect to /data route
    res.redirect("/data");
  } catch(e) {
    returnErrorMsg(res, "Unexpected error: " + e);
  }
});

// drop data for concrete movie key
app.get("/dropDB/:movieKey", async (req, res) => {
  try {
    await movieKeyFunctions.dropMovieKeyData(req.params.movieKey);
    // after dropping data redirect to /data route
    res.redirect("/data");
  } catch(e) {
    returnErrorMsg(res, "Unexpected error: " + e);
  }
});

// get whole data from database
app.get("/data", async (req,res) => {
  try {
    var data = await movieKeyFunctions.getData();
    res.render('data');
  } catch(e) {
    returnErrorMsg(res, "Unexpected error: " + e);
  }
});

// get data for concrete key
app.get("/data/:movieKey", async (req,res) => {
  try {
    var data = (await movieKeyFunctions.getData(req.params.movieKey));
    if(data == null) {
      return returnErrorMsg(res, "Movie data for key " + req.params.movieKey + " not found");
    };
    data = data.toObject();

    data.averageAge = data.averageYear == -1 ? "no data" : Math.round((new Date().getFullYear() - data.averageYear));
    data.averageRating = data.averageRating == -1 ? "no data" : Math.round(data.averageRating * 100)/100;
    data.averageRatingsCount = data.averageRatingsCount == -1 ? "no data" : Math.round(data.averageRatingsCount * 100)/100;
    data.averageWantToWatch = data.averageWantToWatch == -1 ? "no data" : Math.round(data.averageWantToWatch * 100)/100;
    data.averageBudget = data.averageBudget == -1 ? "no data" : (Math.round(data.averageBudget * 100)/100 + "$");
    data.averageLength = data.averageLength == -1 ? "no data" : Math.round(data.averageLength * 100)/100;
    data.averageBoxOffice = data.averageBoxOffice == -1 ? "no data" : (Math.round(data.averageBoxOffice * 100)/100 + "$");

    data.fetchedData = [];
    data.movieHrefs.forEach((href,i) => {
      data.fetchedData.push({
        href : href,
        title : data.titles[i] || "noname",
        rating : data.ratings[i] == -1 ? "no rating" : Math.round(data.ratings[i] * 100)/100,
        numOfVotes : data.ratingsCount[i] == -1 ? "no votes" : data.ratingsCount[i],
        year : data.years[i] == -1 ? "no data" : data.years[i]
      });
    })
    res.render('concreteData', {
      data
    });
  } catch(e) {
    returnErrorMsg(res, "Unexpected error: " + e);
  }
});


app.get("/dbData", async (req, res) => {
  try {
    var data = await movieKeyFunctions.getData();
    res.json(data);
  } catch(e) {
    returnErrorMsg(res, "Unexpected error: " + e);
  }
});

app.get("/dbData/:movieKey", async (req,res) => {
  try {
    var data = await movieKeyFunctions.getData(req.params.movieKey);
    if(data == null) {
      return returnErrorMsg(res, "Movie data for key " + req.params.movieKey + " not found");
    };
    res.json(data);
  } catch(e) {
    returnErrorMsg(res, "Unexpected error: " + e);
  }
});

// download data for all keys in database in form on csv
app.get("/csv", async (req, res) => {
  var csv = await movieKeyFunctions.saveToCSV();
  res.setHeader('Content-disposition', 'attachment; filename=allMoviesData.csv');
  res.set('Content-Type', 'text/csv');
  res.status(200).send(csv);
});

// download data for concrete movie key in form of csv
app.get("/csv/:movieKey", async (req, res) => {
  var csv = await movieKeyFunctions.saveToCSV(req.params.movieKey);
  res.setHeader('Content-disposition', 'attachment; filename=' + req.params.movieKey + 'Data.csv');
  res.set('Content-Type', 'text/csv');
  res.status(200).send(csv);
});

// main route - return main html page
app.get("/", (req,res) => {
  res.render('index');
});

// all other routes - return 404
app.get("*", (req,res) => {
  res.render('404', {
      error: 'You are lost.'
  })
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
