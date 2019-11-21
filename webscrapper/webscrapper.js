var { parse } = require("node-html-parser");
var request = require("request");
var baseFilmwebURL = "https://www.filmweb.pl";
var fileHandler = require("../files/fileHandler");

async function getMovieHrefs(movieKeys, errorCallback, successCallback) {
  var numOfExtrElements = 0;
  for(var i=0; i<movieKeys.length; i++) {
    var movieKey = movieKeys[i];
    try {
      await new Promise(async (resolve, reject) => {
        request(baseFilmwebURL + "/search?q=" + encodeURI(movieKey), async (error, response, body) => {
          if(error != null) {
            reject();
          }
          var titleElement = parse(body).querySelectorAll('.filmPreview__title');
          var hrefs = [];
          if(titleElement == null) {
            return errorCallback(movieKey);
          };
          titleElement.forEach(element => {
            hrefs.push(element.parentNode.rawAttrs.split(" ").filter(e => e.startsWith('href'))[0]);
          });
          hrefs = hrefs.map(href => href.split("").slice(6,-1).join(""));
          if(hrefs.length == 0) {
            return errorCallback(movieKey);
          }
          await fetchAndSaveInfoFromHrefs(hrefs, movieKey, () => {
            errorCallback(movieKey);
          });
          numOfExtrElements += 1;
          resolve();
        });
      });
    } catch(e) {
      return errorCallback(e);
    };
  };
  successCallback(numOfExtrElements);
};

async function fetchAndSaveInfoFromHrefs(hrefs, movieKey, errorCallback) {
  var hrefLenghts = 0;
  var toSaveData = [];
  hrefs.forEach(async href => {
    request(baseFilmwebURL + href, async (error, response, body) => {
      hrefLenghts+=1;
      if(error != null){
        return;
      }
      toSaveData.push(parseInfo(parse(body, {
        script: true // retrieve content in <script> (hurt performance slightly)
      }).querySelector('[data-type="setfilm"]').firstChild.rawText.split(','), href))
      if(hrefLenghts >= hrefs.length) {
        await createAndSaveMovieData(toSaveData, movieKey);
      }
    });
  });
};

function createAndSaveMovieData(data, movieKey) {
  var movieKeyJsonData = {
    key : movieKey,
    ratings : [],
    ratingsCount : [],
    years : [],
    movieHrefs : []
  };
  for(var i=0; i<data.length; i++) {
    movieKeyJsonData.ratings.push(eval(data[i].rate));
    movieKeyJsonData.ratingsCount.push(eval(data[i].ratingCount));
    movieKeyJsonData.years.push(eval(data[i].year));
    movieKeyJsonData.movieHrefs.push(data[i].href);
  };
  fileHandler.saveData(movieKeyJsonData);
}

function parseInfo(info, href) {
  let result = {};
  info.forEach(i => {
    if(i.startsWith('year:')) {
      i = i.split(":");
      result.year = i[1];
    } else if(i.startsWith('rate:')) {
      i = i.split(":");
      result.rate = i[1];
    } else if(i.startsWith('ratingCount:')) {
      i = i.split(":");
      result.ratingCount = i[1];
    }
  });
  result.href = href;
  return result;
}

module.exports = {
  getMovieHrefs,
  fetchAndSaveInfoFromHrefs
}
