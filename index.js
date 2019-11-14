var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post("/e", async (req, res) => {
  if(req.body != null && req.body.movieKey != null) {
    var result = await request("https://www.filmweb.pl/search?q=" + encodeURI(req.body.movieKey), (error, response, body) => {
      return res.send(body);
    });
  } else {
    res.status(400).json({
      "error" : "You must provide non empty movie key"
    });
  }
});

app.get("*", (req,res) => {
  res.status(404).send("Not found - you are lost");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
