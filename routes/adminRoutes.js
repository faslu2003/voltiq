const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');

const authMiddleware = require('../middlewares/authMiddleware');



router.get('/signin', adminController.getSignin);
router.post('/signin', adminController.postSignin);


router.use(authMiddleware.authenticateAdmin);


router.get('/customers', adminController.getCustomers);

router.post('/customers/:id/status', adminController.upddateCustomerStatus);





module.exports = router;