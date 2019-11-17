var express = require("express");
var bodyParser = require("body-parser");
var webscrapper = require("./webscrapper/webscrapper");

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

function return400(res, errorMsg) {
  return res.status(400).json({
    "error" : errorMsg
  });
};

app.post("/e", async (req, res) => {
  if(req.body != null && req.body.movieKey != null) {
    webscrapper.getMovieHrefs(req.body.movieKey, () => {
      return400(res, "Movies for this key not found");
    }, (hrefs) => {
      webscrapper.fetchAndSaveInfoFromHrefs(hrefs, req.body.movieKey, (e) => {
        return400(res, "Unexpected Error contact administration: " + e);
      }, (body) => {
        res.status(200).json({
          message : "Success"
        });
      });
    })
  } else {
    return return400(res, "You must provide non empty movie key");
  }
});

app.get("*", (req,res) => {
  res.status(404).send("Not found - you are lost");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
