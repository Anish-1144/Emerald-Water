const express = require('express');
const router = express.Router();
const { saveDesign, getAllDesigns, getDesign, deleteDesign } = require('../controllers/design.controller');

router.post('/', saveDesign);
router.get('/', getAllDesigns);
router.get('/:id', getDesign);
router.delete('/:id', deleteDesign);

module.exports = router;

