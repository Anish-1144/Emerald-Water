const Design = require('../models/Design.model');

// Create or update design
const saveDesign = async (req, res) => {
  try {
    const { design_json, label_image, print_pdf, bottle_snapshot, is_draft, design_id } = req.body;

    if (design_id) {
      // Update existing design
      const design = await Design.findByIdAndUpdate(
        design_id,
        {
          design_json,
          label_image,
          print_pdf,
          bottle_snapshot,
          is_draft
        },
        { new: true }
      );

      if (!design) {
        return res.status(404).json({ message: 'Design not found' });
      }

      return res.json(design);
    } else {
      // Create new design
      const design = new Design({
        design_json,
        label_image,
        print_pdf,
        bottle_snapshot,
        is_draft: is_draft || false
      });

      await design.save();
      res.status(201).json(design);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all designs
const getAllDesigns = async (req, res) => {
  try {
    const designs = await Design.find()
      .sort({ createdAt: -1 });
    res.json(designs);
  } catch (error) {
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
    const design = await Design.findByIdAndDelete(req.params.id);

    if (!design) {
      return res.status(404).json({ message: 'Design not found' });
    }

    res.json({ message: 'Design deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { saveDesign, getAllDesigns, getDesign, deleteDesign };

