const express = require('express');
const router = express.Router();
const { saveDesign, getUserDesigns, getDesign, deleteDesign } = require('../controllers/design.controller');
const { auth } = require('../middleware/auth.middleware');

router.post('/', auth, saveDesign);
router.get('/', auth, getUserDesigns);
router.get('/:id', auth, getDesign);
router.delete('/:id', auth, deleteDesign);

module.exports = router;

