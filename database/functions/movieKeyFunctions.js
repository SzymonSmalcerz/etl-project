const MovieKey = require("../models/MovieKeyData");
var fileHandler = require("../../files/fileHandler");

async function transform (movieKeys) {
  var numOfTransformedElements = 0;
  for(var i=0; i<movieKeys.length; i++) {
    var data = fileHandler.loadData(movieKeys[i]);
    if(data != null) {
      if(data.years != null) {
        data.averageYear = data.years.reduce((x,y) => x+y ,0)/data.years.length;
      }
      if(data.ratingsCount != null) {
        data.averageRatingsCount = data.ratingsCount.reduce((x,y) => x+y ,0)/data.ratingsCount.length;
      }
      if(data.ratings != null) {
        data.averageRating = data.ratings.reduce((x,y) => x+y ,0)/data.ratings.length;
      };
      fileHandler.saveData(data);
      numOfTransformedElements += 1;
    } else {
      return {
        error : "file for this movie key not found, contact administration"
      };
    };
  };
  return {
    numOfTransformedElements
  };
};

async function load(movieKeys) {
  var numOfLoadedElements = 0;
  for(var i=0; i<movieKeys.length; i++) {
    var data = fileHandler.loadData(movieKeys[i]);
    if(data != null) {
      try {
        await MovieKey.deleteOne({key : movieKeys[i]});
        var movieData = new MovieKey(data);
        await movieData.save();
        fileHandler.deleteData(movieKeys[i]);
        numOfLoadedElements += 1;
      } catch(e) {
        return e;
      }
    } else {
      return {
        error : "file for this movie key not found, contact administration"
      };
    };
  };
  return {
    numOfLoadedElements
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
  }, "moviesData");
  return fileHandler.getCSV("moviesData");
}

module.exports = {
  transform,
  load,
  dropMovieKeyData,
  getData,
  saveToCSV
};
