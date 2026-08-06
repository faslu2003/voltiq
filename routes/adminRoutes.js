const express = require('express');
const router = express.Router();


const adminController = require('../controllers/adminController');



router.get('/signin', adminController.getSignin);
router.post('/signin', adminController.postSignin);

router.get('/customers', adminController.getCustomers);


module.exports = router;