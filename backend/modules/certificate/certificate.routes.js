const express = require('express');
const {
    getCertificates,
    getMyCertificates,
    getCertificateById,
    verifyCertificate,
    createCertificate,
    deleteCertificate,
} = require('./certificate.controller');
const { protect, staffOnly } = require('../../middlewares/auth.middleware');

const router = express.Router();

// Student: my certificates
router.get('/my-certificates', protect, getMyCertificates);

// Public: verify certificate
router.get('/verify/:certId', verifyCertificate);

// Admin
router.route('/').get(protect, staffOnly, getCertificates).post(protect, staffOnly, createCertificate);
router.route('/:id').get(getCertificateById).delete(protect, staffOnly, deleteCertificate);

module.exports = router;
