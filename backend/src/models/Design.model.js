const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  design_json: {
    type: Object,
    required: true
  },
  label_image: {
    type: String, // S3 URL (only stored after payment confirmation)
    required: false
  },
  print_pdf: {
    type: String, // S3 URL to PDF/image file (only stored after payment confirmation)
    required: false
  },
  bottle_snapshot: {
    type: String, // S3 URL to snapshot image (only stored after payment confirmation)
    required: false
  },
  is_draft: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
designSchema.index({ createdAt: -1 });
designSchema.index({ is_draft: 1 });

module.exports = mongoose.model('Design', designSchema);

