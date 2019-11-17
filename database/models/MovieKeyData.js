const mongoose = require('../connection/mongoose');

const movieKeySchema = new mongoose.Schema({
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
});

movieKeySchema.pre('save', function(next) {
  if(this.years != null) {
    this.averageYear = this.years.reduce((x,y) => x+y ,0)/this.years.length;
  }
  if(this.ratingsCount != null) {
    this.averageRatingsCount = this.ratingsCount.reduce((x,y) => x+y ,0)/this.ratingsCount.length;
  }
  if(this.ratings != null) {
    this.averageRating = this.ratings.reduce((x,y) => x+y ,0)/this.ratings.length;
  }
  next();
});

const MovieKey = mongoose.model('MovieKey', movieKeySchema);

module.exports = MovieKey
