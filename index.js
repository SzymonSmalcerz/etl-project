var express = require("express");
var bodyParser = require("body-parser");
var webscrapper = require("./webscrapper/webscrapper");
var movieKeyFunctions = require("./database/functions/movieKeyFunctions");

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var lastKeyEntered;
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
    if(req.body != null && req.body.movieKey != null) {
      webscrapper.getMovieHrefs(req.body.movieKey, () => {
        return400(res, "Movies for this key not found");
      }, (hrefs) => {
        webscrapper.fetchAndSaveInfoFromHrefs(hrefs, req.body.movieKey, (e) => {
          return400(res, "Unexpected Error contact administration: " + e);
        }, (body) => {
          currentState = "E";
          lastKeyEntered = req.body.movieKey;
          res.status(200).json({
            message : "Success"
          });
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
    var error = await movieKeyFunctions.transform(lastKeyEntered);
    if(error) {
      return return400(res, "Unexpected error: " + error);
    }
    currentState = "T";
    res.json({
      message : "Success"
    });
  } else {
    return400(res, "Non proper state for that call (N(E ... -> E) [ N >= 1 ] -> T -> L -> E -> ...)");
  }
});

app.post("/l", async(req, res) => {
  if(currentState == "T") {
    currentState = "L";
    res.send("mock");
  } else {
    return400(res, "Non proper state for that call (N(E ... -> E) [ N >= 1 ] -> T -> L -> E -> ...)");
  }
});

app.get("/state", (req, res) => {
  res.json({
    currentState,
    lastKeyEntered
  });
});

app.get("*", (req,res) => {
  res.status(404).send("Not found - you are lost");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
