const mongoose = require('../connection/mongoose');

const keySchema = new mongoose.Schema({
    key: { // loaded from html in extract step
        type: String,
        required: true,
        trim: true
    },
    ratings: { // loaded from html in extract step
        type: [Number],
        required: true,
        default: []
    },
    averageRating: { // created in transform step
        type: Number
    },
    ratingsCount: { // loaded from html in extract step
        type: [Number],
        required: true,
        default: []
    },
    averageRatingsCount: { // created in transform step
        type: Number
    },
    years: { // loaded from html in extract step
      type: [Number],
      required : true,
      default: []
    },
    averageYear: { // created in transform step
      type: Number
    },
    movieHrefs : { // loaded from html in extract step
      type: [String],
      required : true,
      default: []
    },
    titles : { // loaded from html in extract step
      type: [String],
      required : true,
      default: []
    },
    wantToWatchs: { // loaded from html in extract step
      type: [Number],
      required : true,
      default: []
    },
    averageWantToWatch : { // created in transform step
      type: Number
    },
    budgets: { // loaded from html in extract step
      type: [Number],
      required : true,
      default: []
    },
    averageBudget : { // created in transform step
      type: Number
    },
    movieLengths: { // loaded from html in extract step
      type: [Number],
      required : true,
      default: []
    },
    averageLength : { // created in transform step
      type: Number
    },
    boxOffices: { // loaded from html in extract step
      type: [Number],
      required : true,
      default: []
    },
    averageBoxOffice : { // created in transform step
      type: Number
    }
});

const MovieKey = mongoose.model('MovieKey', keySchema);

module.exports = MovieKey
