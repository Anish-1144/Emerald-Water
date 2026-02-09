const Design = require('../models/Design.model');
const { uploadDesignImages, deleteFromS3 } = require('../services/s3.service');

// Create or update design
const saveDesign = async (req, res) => {
  try {
    const { design_json, label_image, print_pdf, bottle_snapshot, is_draft, design_id } = req.body;

    // Upload images to S3 if they are base64 data URLs
    let s3Urls = {
      label_image: label_image,
      print_pdf: print_pdf,
      bottle_snapshot: bottle_snapshot,
    };

    // Only upload if we have base64 images (not already S3 URLs)
    const hasBase64Images = 
      (label_image && label_image.startsWith('data:')) ||
      (print_pdf && print_pdf.startsWith('data:')) ||
      (bottle_snapshot && bottle_snapshot.startsWith('data:'));

    if (hasBase64Images) {
      try {
        const uploadedUrls = await uploadDesignImages({
          label_image,
          print_pdf,
          bottle_snapshot,
        });
        s3Urls = { ...s3Urls, ...uploadedUrls };
      } catch (uploadError) {
        console.error('S3 upload error:', uploadError);
        return res.status(500).json({ 
          message: 'Failed to upload images to S3', 
          error: uploadError.message 
        });
      }
    }

    if (design_id) {
      // Get existing design to delete old S3 files if needed
      const existingDesign = await Design.findById(design_id);
      
      // Update existing design
      const design = await Design.findByIdAndUpdate(
        design_id,
        {
          design_json,
          label_image: s3Urls.label_image,
          print_pdf: s3Urls.print_pdf,
          bottle_snapshot: s3Urls.bottle_snapshot,
          is_draft
        },
        { new: true }
      );

      if (!design) {
        return res.status(404).json({ message: 'Design not found' });
      }

      // Delete old S3 files if they were replaced with new uploads
      if (existingDesign) {
        if (existingDesign.label_image && existingDesign.label_image !== s3Urls.label_image) {
          await deleteFromS3(existingDesign.label_image);
        }
        if (existingDesign.print_pdf && existingDesign.print_pdf !== s3Urls.print_pdf) {
          await deleteFromS3(existingDesign.print_pdf);
        }
        if (existingDesign.bottle_snapshot && existingDesign.bottle_snapshot !== s3Urls.bottle_snapshot) {
          await deleteFromS3(existingDesign.bottle_snapshot);
        }
      }

      return res.json(design);
    } else {
      // Create new design
      const design = new Design({
        design_json,
        label_image: s3Urls.label_image,
        print_pdf: s3Urls.print_pdf,
        bottle_snapshot: s3Urls.bottle_snapshot,
        is_draft: is_draft || false
      });

      await design.save();
      res.status(201).json(design);
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
    const designs = await Design.find()
      .sort({ createdAt: -1 })
      .allowDiskUse(true)
      .limit(1000); // Limit to prevent memory issues
    res.json(designs);
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single design
const getDesign = async (req, res) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({ message: 'Design not found' });
    }

    res.json(design);
  } catch (error) {
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

