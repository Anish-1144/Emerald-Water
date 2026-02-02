const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  design_json: {
    type: Object,
    required: true
  },
  label_image: {
    type: String, // URL or base64
    required: true
  },
  print_pdf: {
    type: String, // URL to PDF file
    required: true
  },
  bottle_snapshot: {
    type: String, // URL to snapshot image
    required: true
  },
  is_draft: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Design', designSchema);

