const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');

const authMiddleware = require('../middlewares/authMiddleware');

const upload = require('../config/multer');



router.get('/signin', adminController.getSignin);
router.post('/signin', adminController.postSignin);


router.use(authMiddleware.authenticateAdmin);


router.get('/customers', adminController.getCustomers);
router.post('/customers/status/:id', adminController.upddateCustomerStatus);


router.get('/categories', adminController.getCategories);
router.post('/categories', upload.single("image"), adminController.postCategory);
router.post('/categories/edit', upload.single("image"), adminController.editCategory);
router.post('/categories/toggle-status', adminController.toggleCategoryStatus);


router.get('/products', adminController.getProducts);
router.post('/products', upload.any(), adminController.postProducts);
router.post('/products/toggle-status', adminController.toggleProductStatus);
router.post('/products/edit', upload.any(), adminController.editProduct);


router.get('/brands', adminController.getBrands);


router.post('/logout', adminController.logout);



module.exports = router;