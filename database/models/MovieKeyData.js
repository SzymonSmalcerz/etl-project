const mongoose = require('../connection/mongoose');

const MovieKey = mongoose.model('MovieKey', {
    key: {
        type: String,
        required: true,
        trim: true
    },
    ratings: {
        type: [Number],
        required: true,
        default: []
    },
    averageRating: {
        type: Number
    },
    ratingsCount: {
        type: [Number],
        required: true,
        default: []
    },
    averageRatingsCount: {
        type: Number
    },
    years: {
      type: [Number],
      required : true,
      default: []
    },
    averageYear: {
      type: Number
    },
    movieHrefs : {
      type: [String],
      required : true,
      default: []
    }
})

module.exports = MovieKey
