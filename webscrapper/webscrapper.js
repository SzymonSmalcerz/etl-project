var { parse } = require("node-html-parser");
var request = require("request");
var baseFilmwebURL = "https://www.filmweb.pl";
var fileHandler = require("../files/fileHandler");

// main function for EXTRACT step - for each movie key
// it extracts its entitites (html from hrefs) and then it
// extracts parameters and saves into a json files
async function getMovieHrefs(movieKeys, errorCallback, successCallback) {
  // counter of fully exctacred movie keys
  var numOfExtrElements = 0;
  // titles of entities found while searching for a key on filmweb
  var titles = [];
  for(var i=0; i<movieKeys.length; i++) {
    var movieKey = movieKeys[i];
    try {
      await new Promise(async (resolve, reject) => {
        // for each movie key fetch html
        request(baseFilmwebURL + "/search?q=" + encodeURI(movieKey), async (error, response, body) => {
            if(error != null) {
              reject();
            }
            // parse body and for each fetched href of a entity fetch and save its data
            var fetchedKeyData = parse(body).querySelectorAll('.filmPreview__title');
            // hrefs of entities found while searching for a key on filmweb
            var hrefs = [];
            // if no data found return error
            if(fetchedKeyData == null) {
              return errorCallback(movieKey);
            };
            // for each entity fetch its title and href link
            fetchedKeyData.forEach((element, index) => {
              // populate title of a movie from fetched html
              if(element.childNodes[0] != null) {
                titles.push(element.childNodes[0].rawText);
              } else {
                titles.push("noname");
              }
              // populate href of a movie from fetched html
              hrefs.push(element.parentNode.rawAttrs.split(" ")
                   .filter(e => e.startsWith('href'))[0]);
            });
            // adjust hrefs
            hrefs = hrefs.map(href => href.split("").slice(6,-1).join(""));
            // if no href found return error
            if(hrefs.length == 0) {
              return errorCallback(movieKey);
            }
            // fetch and save information for each href for this key
            await fetchAndSaveInfoFromHrefs(hrefs, movieKey, () => {
              // error callback - called when error occured
              errorCallback(movieKey);
            }, () => {
              // success callback - called when success occured
              numOfExtrElements += 1;
              if(numOfExtrElements == movieKeys.length) {
                successCallback(numOfExtrElements, titles);
              };
            });
            resolve();
          });
      });
    } catch(e) {
      return errorCallback(e);
    };
  };
  return;
};

// fetch data for this href, parse it and save to json file
async function fetchAndSaveInfoFromHrefs(hrefs, movieKey, errorCallback, successCallback) {
  // counter
  var hrefLenghts = 0;
  // data which will be saved into a file
  var toSaveData = [];

  hrefs.forEach(async href => {
    // for each href fetch html data
    await request(baseFilmwebURL + href, async (error, response, body) => {
      hrefLenghts+=1;
      if(error != null){
        return;
      }
      // fetch date to save (this data will be transformed later)
      var wantToWatch = getWantToWatch(body);
      var movieLength = getMovieLength(body);
      var boxOffice = getBoxOffice(body);
      var budget = getBudget(body);
      var additionalData = {
        wantToWatch,
        movieLength,
        boxOffice,
        budget
      };
      // add data which must be saved into a file
      toSaveData.push(parseInfo(parse(body, {
        script: true // retrieve content in <script> (hurt performance slightly)
      }).querySelector('[data-type="setfilm"]').firstChild.rawText
        .split(','), href, additionalData));
      if(hrefLenghts >= hrefs.length) {
        // if last href was processed save file into json
        await createAndSaveMovieData(toSaveData, movieKey);
        // call success callback
        successCallback();
      }
    });
  });
};


// fetch how many people want to interact with this entity from downloaded html
function getWantToWatch(body) {
  var temp = body;
  if(body.split("wtsInfo:\"")[1] != null) {
    temp = body.split("wtsInfo:\"")[1].split(" chce");
    temp = temp[0];
  }
  var result = 0;
  try {
    result = eval(temp.split(" ").join(""));
  } catch(e) {
    result = -1;
  }
  return result;
}

// fetch movieLength from downloaded html
function getMovieLength(body) {
  if(body.split("datetime=\"PT")[1] != null) {
    temp = body.split("datetime=\"PT")[1].split(". <a cla")[0];
    temp = temp.split("M\">")[1];
    temp = temp.trim();
    var minutes = 0;
    var hours = 0;
    var timeText = temp.split(' godz.');
    if(timeText[1] != null) {
      minutes = timeText[1].trim().split(' min')[0];
      hours = timeText[0].trim();
    } else {
      if(timeText[0].includes("min")) {
        minutes = temp.split(' min')[0];
      } else {
        hours = timeText[0];
      }
    }

    try {
      return eval(minutes) + eval(hours) * 60;
    } catch (e) {
      return -1;
    }
  } else {
    return -1;
  }
}

// fetch boxoffice from downloaded html
function getBoxOffice(body) {
  try {
    var temp = body;
    if(body.split("boxoffice:</th><td>$")[1] != null) {
      if(body.split("boxoffice:</th><td>$")[1].slice(0, 50).split(" <a href")[1] != null) {
        temp = body.split("boxoffice:</th><td>$")[1].slice(0, 50).split("<a href")[0].trim();
      } else {
        temp = body.split("boxoffice:</th><td>$")[1].slice(0, 50).split("</td>")[0].trim();
      }
      return eval(temp.split(" ").join(""));
    } else {
      return -1;
    }
  } catch(e) {
    return -1;
  }
}

// fetch budget from downloaded html
function getBudget(body) {
  try {
    var temp = body;
    if(body.split("budżet:</dt><dd>$")[1] != null) {
      temp = body.split("budżet:</dt><dd>$")[1].slice(0, 50).split("</dd>")[0].trim();
      return eval(temp.split(" ").join(""));
    } else {
      return -1;
    }
  } catch(e) {
    return -1;
  }
}


// save movie data to json file on server
async function createAndSaveMovieData(data, movieKey) {
  var movieKeyJsonData = {
    key : movieKey,
    ratings : [],
    ratingsCount : [],
    years : [],
    movieHrefs : [],
    titles : [],
    wantToWatchs : [],
    budgets : [],
    movieLengths : [],
    boxOffices : []
  };
  for(var i=0; i<data.length; i++) {
    movieKeyJsonData.ratings.push(eval(data[i].rate || -1));
    movieKeyJsonData.ratingsCount.push(eval(data[i].ratingCount || -1));
    movieKeyJsonData.years.push(eval(data[i].year || -1));
    movieKeyJsonData.movieHrefs.push(data[i].href || "no href");
    movieKeyJsonData.titles.push(data[i].title || "noname");
    movieKeyJsonData.wantToWatchs.push(data[i].additionalData.wantToWatch || -1);
    movieKeyJsonData.budgets.push(data[i].additionalData.budget || -1);
    movieKeyJsonData.movieLengths.push(data[i].additionalData.movieLength || -1);
    movieKeyJsonData.boxOffices.push(data[i].additionalData.boxOffice || -1);
  };
  // save this data to json file
  await fileHandler.saveData(movieKeyJsonData);
}

// parse information downloaded from href
// result of this function is directly saved to json file
function parseInfo(info, href, additionalData) {
  let result = {};
  info.forEach(i => {
    if(i.startsWith('year:')) {
      i = i.split("year:");
      result.year = i[1];
    } else if(i.startsWith('rate:')) {
      i = i.split("rate:");
      result.rate = i[1];
    } else if(i.startsWith('ratingCount:')) {
      i = i.split("ratingCount:");
      result.ratingCount = i[1];
    } else if(i.startsWith('title:')) {
      i = i.split("title:");
      result.title = i[1];
    }
  });
  result.href = href;
  result.additionalData = additionalData;
  return result;
}

// exported functions which can be used in other files
module.exports = {
  getMovieHrefs,
  fetchAndSaveInfoFromHrefs
}
