const Design = require('../models/Design.model');
const { uploadDesignImages, deleteFromS3 } = require('../services/s3.service');

// Create or update design
const saveDesign = async (req, res) => {
  try {
    const { design_json, label_image, print_pdf, bottle_snapshot, is_draft, design_id } = req.body;

    // Check if images are base64 (from localStorage) or S3 URLs (already uploaded)
    const hasBase64Images = 
      (label_image && label_image.startsWith('data:')) ||
      (print_pdf && print_pdf.startsWith('data:')) ||
      (bottle_snapshot && bottle_snapshot.startsWith('data:'));

    // If images are base64, DO NOT store them in database
    // They will remain in localStorage until payment is confirmed
    // Only store S3 URLs in database (after payment)
    let imageUrls = {};
    
    if (!hasBase64Images) {
      // Images are already S3 URLs, store them
      imageUrls = {
        ...(label_image && { label_image }),
        ...(print_pdf && { print_pdf }),
        ...(bottle_snapshot && { bottle_snapshot }),
      };
    }
    // If hasBase64Images is true, don't store images - they stay in localStorage

    if (design_id) {
      // Get existing design to delete old S3 files if needed
      const existingDesign = await Design.findById(design_id).maxTimeMS(15000);
      
      // Update existing design - only update images if they are S3 URLs
      const updateData = {
        design_json,
        is_draft,
        ...imageUrls, // Only include if images are S3 URLs
      };

      const design = await Design.findByIdAndUpdate(
        design_id,
        updateData,
        { new: true, maxTimeMS: 15000 }
      );

      if (!design) {
        return res.status(404).json({ message: 'Design not found' });
      }

      // Delete old S3 files if they were replaced with new uploads
      if (existingDesign) {
        if (existingDesign.label_image && imageUrls.label_image && 
            existingDesign.label_image !== imageUrls.label_image &&
            existingDesign.label_image.startsWith('http')) {
          await deleteFromS3(existingDesign.label_image);
        }
        if (existingDesign.print_pdf && imageUrls.print_pdf && 
            existingDesign.print_pdf !== imageUrls.print_pdf &&
            existingDesign.print_pdf.startsWith('http')) {
          await deleteFromS3(existingDesign.print_pdf);
        }
        if (existingDesign.bottle_snapshot && imageUrls.bottle_snapshot &&
            existingDesign.bottle_snapshot !== imageUrls.bottle_snapshot &&
            existingDesign.bottle_snapshot.startsWith('http')) {
          await deleteFromS3(existingDesign.bottle_snapshot);
        }
      }

      // Return design with images from request if they are base64 (for frontend to keep in localStorage)
      const responseDesign = design.toObject();
      if (hasBase64Images) {
        responseDesign.label_image = label_image;
        responseDesign.print_pdf = print_pdf;
        responseDesign.bottle_snapshot = bottle_snapshot;
      }

      return res.json(responseDesign);
    } else {
      // Create new design - only store images if they are S3 URLs
      const design = new Design({
        design_json,
        ...imageUrls, // Only include if images are S3 URLs
        is_draft: is_draft || false
      });

      await design.save();

      // Return design with images from request if they are base64 (for frontend to keep in localStorage)
      const responseDesign = design.toObject();
      if (hasBase64Images) {
        responseDesign.label_image = label_image;
        responseDesign.print_pdf = print_pdf;
        responseDesign.bottle_snapshot = bottle_snapshot;
      }

      res.status(201).json(responseDesign);
    }
  } catch (error) {
    console.error('Error saving design:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all designs
const getAllDesigns = async (req, res) => {
  try {
    // Use allowDiskUse to handle large sorts, and limit results for performance
    // Add maxTimeMS to prevent queries from hanging indefinitely
    const designs = await Design.find()
      .sort({ createdAt: -1 })
      .allowDiskUse(true)
      .limit(1000) // Limit to prevent memory issues
      .maxTimeMS(25000); // Timeout after 25 seconds
    
    res.json(designs);
  } catch (error) {
    console.error('Error fetching designs:', error);
    
    // Provide more specific error messages
    if (error.name === 'MongoNetworkTimeoutError' || error.name === 'MongoServerSelectionError') {
      return res.status(503).json({ 
        message: 'Database connection timeout. Please try again later.',
        error: 'Service Unavailable',
        retry: true
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

// Get single design
const getDesign = async (req, res) => {
  try {
    const design = await Design.findById(req.params.id).maxTimeMS(15000);

    if (!design) {
      return res.status(404).json({ message: 'Design not found' });
    }

    res.json(design);
  } catch (error) {
    if (error.name === 'MongoNetworkTimeoutError' || error.name === 'MongoServerSelectionError') {
      return res.status(503).json({ 
        message: 'Database connection timeout. Please try again later.',
        error: 'Service Unavailable',
        retry: true
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete design
const deleteDesign = async (req, res) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({ message: 'Design not found' });
    }

    // Delete images from S3
    if (design.label_image) {
      await deleteFromS3(design.label_image);
    }
    if (design.print_pdf) {
      await deleteFromS3(design.print_pdf);
    }
    if (design.bottle_snapshot) {
      await deleteFromS3(design.bottle_snapshot);
    }

    // Delete from database
    await Design.findByIdAndDelete(req.params.id);

    res.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Error deleting design:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { saveDesign, getAllDesigns, getDesign, deleteDesign };

