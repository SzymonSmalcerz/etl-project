var { parse } = require("node-html-parser");
var request = require("request");
var baseFilmwebURL = "https://www.filmweb.pl";
var MovieKey = require("../database/models/MovieKeyData");

function getMovieHrefs(movieKey, errorCallback, successCallback) {
  request(baseFilmwebURL + "/search?q=" + encodeURI(movieKey), (error, response, body) => {
    var titleElement = parse(body).querySelectorAll('.filmPreview__title');
    var hrefs = [];
    if(titleElement == null) {
      return errorCallback();
    }
    titleElement.forEach(element => {
      hrefs.push(element.parentNode.rawAttrs.split(" ").filter(e => e.startsWith('href'))[0]);
    });
    hrefs = hrefs.map(href => href.split("").slice(6,-1).join(""));
    if(hrefs.length == 0) {
      return errorCallback();
    }
    successCallback(hrefs);
  });
};

function fetchAndSaveInfoFromHrefs(hrefs, movieKey, errorCallback, successCallback) {
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
        successCallback(body);
      }
    });
  });

};

async function createAndSaveMovieData(data, movieKey) {
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
  console.log(data);
  var movieKeyData = new MovieKey(movieKeyJsonData);
  await movieKeyData.save();
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
