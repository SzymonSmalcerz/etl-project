const fs = require('fs')
const { Parser } = require('json2csv');
const util = require('util');

// make these functions applicable for async/await functionality
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);
const readFile = util.promisify(fs.readFile);
// variable used to specify which fields extract to csv file
const fields = ['items.key', 'items.averageRating',
                'items.averageRatingsCount', 'items.averageYear'];

// parse json data to csv and save it into the csv file
const saveToCsv = (data, fileName) => {
  const json2csvParser = new Parser({ fields,
                          unwind: ['items'], unwindBlank: true });
  const csv = json2csvParser.parse(data);
  fs.writeFileSync( fileName + '.csv', csv);
};

// fetch csv file from server
const getCSV = (fileName) => {
  return fs.readFileSync(fileName + '.csv');
}

// save data to json file, used in extract and transform step
const saveData = async (data) => {
  const dataJSON = JSON.stringify(data);
  await writeFile( data.key + '.json', dataJSON);
};

// load data from json file, used in transform and load step
const loadData = async (movieKey) => {
    try {
        const dataBuffer = await readFile(movieKey + '.json')
        const dataJSON = dataBuffer.toString()
        return JSON.parse(dataJSON)
    } catch (e) {
        return null;
    }
};

// delete json file fo particular entityKey
const deleteData = async (entityKey) => {
   await unlink(entityKey + ".json");
};

module.exports = {
  loadData,
  saveData,
  deleteData,
  saveToCsv,
  getCSV
};
