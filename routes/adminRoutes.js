const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');

const authMiddleware = require('../middlewares/authMiddleware');

const upload = require('../config/multer');



router.get('/signin', adminController.getSignin);
router.post('/signin', adminController.postSignin);


router.use(authMiddleware.authenticateAdmin);


router.get('/customers', adminController.getCustomers);
router.patch('/customers/status/:id', adminController.updateCustomerStatus);


router.get('/categories', adminController.getCategories);
router.post('/categories', upload.single("image"), adminController.postCategory);
router.post('/categories/edit', upload.single("image"), adminController.editCategory);
router.patch('/categories/toggle-status', adminController.toggleCategoryStatus);


router.get('/products', adminController.getProducts);
router.post('/products', upload.any(), adminController.postProducts);
router.patch('/products/toggle-status', adminController.toggleProductStatus);
router.patch('/products/edit', upload.any(), adminController.editProduct);


router.get('/brands', adminController.getBrands);


router.post('/logout', adminController.logout);



module.exports = router;