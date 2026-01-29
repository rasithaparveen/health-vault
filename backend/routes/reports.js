const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const MedicalReport = require('../models/MedicalReport');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get reports for a member
router.get('/:memberId', auth, async (req, res) => {
  try {
    const reports = await MedicalReport.find({ memberId: req.params.memberId })
      .sort({ date: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create medical report
router.post('/', auth, [
  body('memberId').isMongoId(),
  body('title').trim().isLength({ min: 1 }),
  body('type').isIn(['lab', 'imaging', 'prescription', 'discharge', 'other']),
  body('date').isISO8601(),
  body('fileUrl').trim().isLength({ min: 1 }),
  body('fileType').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const report = new MedicalReport(req.body);
    await report.save();

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'create',
      entityType: 'report',
      entityId: report._id.toString(),
      description: `Added medical report: ${report.title}`
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update medical report
router.put('/:id', auth, async (req, res) => {
  try {
    const report = await MedicalReport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({ error: 'Medical report not found' });
    }

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'update',
      entityType: 'report',
      entityId: report._id.toString(),
      description: `Updated medical report: ${report.title}`
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete medical report
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ error: 'Medical report not found' });
    }

    await MedicalReport.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'delete',
      entityType: 'report',
      entityId: report._id.toString(),
      description: `Deleted medical report: ${report.title}`
    });

    res.json({ message: 'Medical report deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;