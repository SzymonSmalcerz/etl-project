var express = require("express");
var bodyParser = require("body-parser");
var webscrapper = require("./webscrapper/webscrapper");
var movieKeyFunctions = require("./database/functions/movieKeyFunctions");

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var lastKeysEntered;
var currentState = "L";
var nextState = {
  "E" : "T",
  "T" : "L",
  "L" : "E"
}

function return400(res, errorMsg) {
  return res.status(400).json({
    "error" : errorMsg
  });
};

app.post("/e", async (req, res) => {
  if(currentState == "E" || currentState == "L") {
    if(req.body != null && req.body.movieKeys != null) {
      webscrapper.getMovieHrefs(req.body.movieKeys, (movieKey) => {
        return400(res, "Movies for key " + movieKey + " not found");
      }, (numOfExtrElements) => {
        currentState = "E";
        lastKeysEntered = req.body.movieKeys;
        res.status(200).json({
          message : "Success, num of extracted elements: " + numOfExtrElements
        });
      });
    } else {
      return return400(res, "You must provide non empty movie key");
    }
  } else {
    return400(res, "Non proper state for that call (N(E ... -> E) [ N >= 1 ] -> T -> L -> E -> ...)");
  }
});

app.post("/t", async(req, res) => {
  if(currentState == "E") {
    var result = await movieKeyFunctions.transform(lastKeysEntered);
    if(result.error) {
      return return400(res, "Unexpected error: " + result.error);
    }
    currentState = "T";
    res.json({
      message : "Success, number of transformed elements: " + result.numOfTransformedElements
    });
  } else {
    return400(res, "Non proper state for that call (N(E ... -> E) [ N >= 1 ] -> T -> L -> E -> ...)");
  }
});

app.post("/l", async(req, res) => {
  if(currentState == "T") {
    var result = await movieKeyFunctions.load(lastKeysEntered);
    if(result.error) {
      return return400(res, "Unexpected error: " + result.error);
    }
    currentState = "L";
    res.json({
      message : "Success, number of loadedElements: " + result.numOfLoadedElements
    });
  } else {
    return400(res, "Non proper state for that call (N(E ... -> E) [ N >= 1 ] -> T -> L -> E -> ...)");
  }
});

app.get("/state", (req, res) => {
  res.json({
    currentState,
    lastKeysEntered
  });
});

app.post("/dropDB", async (req, res) => {
  try {
    await movieKeyFunctions.dropMovieKeyData();
    res.json({
      message : "Success"
    });
  } catch(e) {
    return400(res, "Unexpected error: " + e);
  }
});

app.get("/data", async (req,res) => {
  try {
    var data = await movieKeyFunctions.getData();
    res.json({
      data,
      message : "Success"
    });
  } catch(e) {
    return400(res, "Unexpected error: " + e);
  }
});

app.get("/data/:movieKey", async (req,res) => {
  try {
    var data = await movieKeyFunctions.getData(req.params.movieKey);
    if(data == null) {
      return return400(res, "Movie data for key " + req.params.movieKey + " not found");
    };
    res.json({
      data,
      message : "Success"
    });
  } catch(e) {
    return400(res, "Unexpected error: " + e);
  }
});

app.get("/csv", async (req, res) => {
  var csv = await movieKeyFunctions.saveToCSV();
  res.setHeader('Content-disposition', 'attachment; filename=allMoviesData.csv');
  res.set('Content-Type', 'text/csv');
  res.status(200).send(csv);
});

app.get("/csv/:movieKey", async (req, res) => {
  var csv = await movieKeyFunctions.saveToCSV(req.params.movieKey);
  res.setHeader('Content-disposition', 'attachment; filename=' + req.params.movieKey + 'Data.csv');
  res.set('Content-Type', 'text/csv');
  res.status(200).send(csv);
});

app.get("*", (req,res) => {
  res.status(404).send("Not found - you are lost");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
