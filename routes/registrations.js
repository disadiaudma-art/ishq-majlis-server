const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Registration = require('../models/Registration');

// Validation rules strictly for the Google Form fields
const formValidation = [
  body('fullName').trim().notEmpty().withMessage('Full Name / പേര് is required'),
  body('place').trim().notEmpty().withMessage('Place / സ്ഥലം is required'),
  body('age').isInt({ min: 1, max: 120 }).withMessage('Valid Age / വയസ്സ് is required'),
  body('gender').isIn(['Male', 'Female']).withMessage('Select Gender / ലിംഗഭേദം'),
  body('attendeesCount').isInt({ min: 1 }).withMessage('Number of Attendees / പങ്കെടുക്കുന്നവരുടെ എണ്ണം is required'),
];

// POST /api/registrations - Submit response
router.post('/', formValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  try {
    const { fullName, place, age, gender, attendeesCount } = req.body;

    const registration = new Registration({
      fullName,
      place,
      age: parseInt(age, 10),
      gender,
      attendeesCount: parseInt(attendeesCount, 10) || 1,
    });

    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Your response has been recorded.',
      data: registration,
    });
  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// GET /api/registrations - Admin list & search
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, gender, search } = req.query;
    const filter = {};

    if (gender && gender !== 'all') {
      filter.gender = gender;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { place: { $regex: search, $options: 'i' } },
        { registrationId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Registration.countDocuments(filter);
    const registrations = await Registration.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-__v');

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: registrations,
    });
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/registrations/stats - Summary metrics
router.get('/stats', async (req, res) => {
  try {
    const totalRegistrations = await Registration.countDocuments();

    const headcountAgg = await Registration.aggregate([
      { $group: { _id: null, totalHeadcount: { $sum: '$attendeesCount' }, avgAge: { $avg: '$age' } } },
    ]);

    const byGender = await Registration.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 }, attendees: { $sum: '$attendeesCount' } } },
      { $sort: { count: -1 } },
    ]);

    const byPlace = await Registration.aggregate([
      { $group: { _id: '$place', count: { $sum: 1 }, attendees: { $sum: '$attendeesCount' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        totalRegistrations,
        totalHeadcount: headcountAgg[0]?.totalHeadcount || 0,
        averageAge: headcountAgg[0]?.avgAge ? Math.round(headcountAgg[0].avgAge) : 0,
        byGender,
        byPlace,
      },
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/registrations/:id - Delete record (admin)
router.delete('/:id', async (req, res) => {
  try {
    const reg = await Registration.findByIdAndDelete(req.params.id);
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    res.json({ success: true, message: 'Registration deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
