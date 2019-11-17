const fs = require('fs')
const { Parser } = require('json2csv');
const fields = ['items.key', 'items.averageRating', 'items.averageRatingsCount', 'items.averageYear'];

const saveToCsv = (data, fileName) => {
  const json2csvParser = new Parser({ fields, unwind: ['items'], unwindBlank: true });
  const csv = json2csvParser.parse(data);
  fs.writeFileSync( fileName + '.csv', csv);
};

const getCSV = (fileName) => {
  return fs.readFileSync(fileName + '.csv');
}

const saveData = (data) => {
  const dataJSON = JSON.stringify(data);
  fs.writeFileSync( data.key + '.json', dataJSON);
};

const loadData = (movieKey) => {
    try {
        const dataBuffer = fs.readFileSync(movieKey + '.json')
        const dataJSON = dataBuffer.toString()
        return JSON.parse(dataJSON)
    } catch (e) {
        return null;
    }
};

const deleteData = (movieKey) => {
   fs.unlinkSync(movieKey + ".json");
};

module.exports = {
  loadData,
  saveData,
  deleteData,
  saveToCsv,
  getCSV
};
