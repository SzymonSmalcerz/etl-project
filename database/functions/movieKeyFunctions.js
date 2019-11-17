const MovieKey = require("../models/MovieKeyData");
var fileHandler = require("../../files/fileHandler");

async function transform (movieKey) {
  try {
    var data = fileHandler.loadData(movieKey);
    if(data != null) {
      await MovieKey.deleteOne({key : movieKey});
      var movieData = new MovieKey(data);
      if(movieData.years != null) {
        movieData.averageYear = movieData.years.reduce((x,y) => x+y ,0)/movieData.years.length;
      }
      if(movieData.ratingsCount != null) {
        movieData.averageRatingsCount = movieData.ratingsCount.reduce((x,y) => x+y ,0)/movieData.ratingsCount.length;
      }
      if(movieData.ratings != null) {
        movieData.averageRating = movieData.ratings.reduce((x,y) => x+y ,0)/movieData.ratings.length;
        console.log(movieData.averageRating);
      }
      await movieData.save();
      fileHandler.deleteData(movieKey);
    } else {
      return "file for this movie key not found, contact administration";
    }
  } catch (e) {
    return e;
  }
};

async function dropMovieKeyData() {
  await MovieKey.deleteMany();
};

async function getData(movieKey) {
  if(movieKey == null) {
    return await MovieKey.find();
  } else {
    return await MovieKey.findOne({
      key : movieKey
    });
  }
};

async function saveToCSV(movieKey) {
  var data = await getData(movieKey);
  fileHandler.saveToCsv({
    items : data
  }, "TEST");
  return fileHandler.getCSV("TEST");
}

module.exports = {
  transform,
  dropMovieKeyData,
  getData,
  saveToCSV
};
