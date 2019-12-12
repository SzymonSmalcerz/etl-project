const MovieKey = require("../models/MovieKeyData");
var fileHandler = require("../../files/fileHandler");

// process TRANSFORM step
async function transform (movieKeys) {
  // counter of transformed movie keys
  var numOfTransformedElements = 0;
  for(var i=0; i<movieKeys.length; i++) {
    // load data from json file
    var data = await fileHandler.loadData(movieKeys[i]);
    if(data != null) {
      if(data.years != null) {
        data.averageYear = getAverage(data.years);
      }
      if(data.ratingsCount != null) {
        data.averageRatingsCount = getAverage(data.ratingsCount);
      }
      if(data.ratings != null) {
        data.averageRating = getAverage(data.ratings);
      };
      if(data.wantToWatchs != null) {
        data.averageWantToWatch = getAverage(data.wantToWatchs);
      };
      if(data.budgets != null) {
        data.averageBudget = getAverage(data.budgets);
      };
      if(data.movieLengths != null) {
        data.averageLength = getAverage(data.movieLengths);
      };
      if(data.boxOffices != null) {
        data.averageBoxOffice = getAverage(data.boxOffices);
      };
      // sava transformed data to json file
      await fileHandler.saveData(data);
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

// get average num from array, exclude numbers below 0
function getAverage(array) {
  if(array.filter(x => x > 0).length == 0) {
    return -1;
  }
  return array.reduce((x,y) => {
    if(x > 0) {
      y += x;
    }
    return y;
  } ,0)/array.filter(x => x > 0).length;
}

// process LOAD step
async function load(movieKeys) {
  var numOfLoadedElements = 0;
  for(var i=0; i<movieKeys.length; i++) {
    // load data from json file
    var data = await fileHandler.loadData(movieKeys[i]);
    if(data != null) {
      try {
        // update or create entry for this key in database
        await MovieKey.update({key : movieKeys[i]}, data, {upsert: true});
        // delete json file
        await fileHandler.deleteData(movieKeys[i]);
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

// drop data from database
async function dropMovieKeyData(entityKey) {
  if(entityKey == null) { // if entityKey is not present delete all data
    await MovieKey.deleteMany();
  } else { // else delete only data for this entityKey
    await MovieKey.remove({
      key : entityKey
    });
  }
};

// get data from database
async function getData(movieKey) {
  if(movieKey == null) { // if entityKey is not present get all data
    return await MovieKey.find();
  } else { // else get data for this entityKey
    return await MovieKey.findOne({
      key : movieKey
    });
  }
};

// save and return csv data for movie key
// if movie key is null then save enr retrieve
// csv file for all keys
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
