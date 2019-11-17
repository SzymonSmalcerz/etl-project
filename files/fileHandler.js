const fs = require('fs')

const saveData = (data) => {
  const dataJSON = JSON.stringify(data)
  fs.writeFileSync( data.key + '.json', dataJSON)
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
}

module.exports = {
  loadData,
  saveData,
  deleteData
}
