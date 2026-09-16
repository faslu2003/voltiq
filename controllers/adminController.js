const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Brand = require('../src/models/Brand');
const Product = require('../src/models/Product');

const adminService = require('../services/adminService');

const STATUS_CODES = require('../constants/statusCode');



exports.getSignin = (req, res) => {

    const error = req.session.error || null;
    req.session.error = null;

    res.render('admin/signin', { error });
}

exports.postSignin = async (req, res) => {

    const result = await adminService.signin(req.body);

    if (!result.success) {
        req.session.error = result.message;
        return res.redirect('/admin/signin');
    }

    try {
        const user = result.user;

        req.session.admin = {
            id: user._id
        }

        res.redirect('/admin/customers');
    }
    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";

        res.redirect('/admin/signin');
    }
}


exports.getCustomers = async (req, res) => {

    const search = req.query.search || "";
    const status = req.query.status || "all";
    const registered = req.query.registered || "all";

    const page = Number(req.query.page) || 1;

    const result = await adminService.getCustomers(page, search, status, registered);

    const customers = result.customers;
    const totalCustomers = result.totalCustomers;
    const stats = result.stats;
    const pagination = result.pagination;

    const error = req.session.error || null;
    req.session.error = null;

    res.render('admin/customers', { customers, totalCustomers, stats, pagination, search, status, registered, error });
}


exports.upddateCustomerStatus = async (req, res) => {

    try {

        const result = await adminService.updateCustomerStatus(req.params.id, req.body.isBlocked);

        res.json(result);
    }
    catch (err) {

        console.log(err);

        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Something went wrong. Please try again." });
    }
}



exports.getCategories = async (req, res) => {

    try {

        const page = parseInt(req.query.page) || 1;
        const limit = 5;

        const result = await adminService.getCategories(page, limit);

        return res.render('admin/categories', result);
    }
    catch (err) {
        console.log(err);

        res.send("Something went wrong");
    }
}

exports.postCategory = async (req, res) => {

    try {

        const result = await adminService.AddCategory(req.body, req.file);

        if (!result.success) {
            req.session.error = result.message;
            return res.redirect('/admin/categories');
        }

        req.session.message = result.message;
        return res.redirect('/admin/categories');
    }
    catch (err) {
        console.log(err);

        req.session.error = "Something went wrong. Please try again."
        return res.redirect('/admin/categories');
    }
}

exports.editCategory = async (req, res) => {

    try {

        const result = await adminService.editCategory(req.body, req.file);

        req.session.message = result.message;
        return res.redirect('/admin/categories');
    }
    catch (err) {
        console.log(err);

        req.session.error = "Something went wrong. Please try again";
        return res.redirect('/admin/categories');
    }
}

exports.toggleCategoryStatus = async (req, res) => {

    try {

        const result = await adminService.toggleCategoryStatus(req.body);

        return res.json(result);
    }
    catch (err) {
        console.log(err);

        return res.json({
            sucess: false,
            message: "Something went wrong."
        });
    }
}



exports.getProducts = async (req, res) => {

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;

        const categories = await Category.find({ isActive: true });
        const brands = await Brand.find({ isActive: true });

        const result = await adminService.getProducts(page, limit);

        return res.render('admin/inventory', { ...result, categories, brands });
    }
    catch (err) {
        console.log(err);

        return res.send("Error loading products.");
    }
}

exports.postProducts = async (req, res) => {

    try {
        const result = await adminService.AddProducts(req.body, req.files);

        if (!result.success) {
            console.log(result.message);
            req.session.error = result.message;
            return res.redirect('/admin/products');
        }

        req.session.message = result.message;
        return res.redirect('/admin/products');
    }
    catch (err) {
        console.log(err);

        req.session.error = "Something went wrong. Please try again."
        return res.redirect('/admin/products');
    }
}

exports.toggleProductStatus = async (req, res) => {

    try {
        const { id } = req.body;

        const result = await adminService.toggleProductStatus(id);

        if (!result.success) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: result.message
            });
        }

        return res.json({
            success: true,
            message: result.message,
            isActive: result.isActive
        });
    }
    catch (err) {
        console.log(err);

        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Something went wrong."
        });
    }
}

exports.editProduct = async (req, res) => {

    try {
        console.log("EDIT CONTROLLER REACHED");

        console.log("BODY:", req.body);

        console.log("FILES:", req.files);


        const result = await adminService.editProduct(req.body, req.files);

        console.log("SERVICE RESULT:", result);

        if (!result.success) {
            req.session.error = result.message;
            return res.redirect('/admin/products');
        }

        req.session.message = result.message;
        return res.redirect('/admin/products');
    }
    catch (err) {
        console.log(err);

        req.session.error = "Something went wrong. Please try again."
        return res.redirect('/admin/products');
    }
}


exports.getBrands = (req, res) => {

    res.render('admin/brands');
}



exports.logout = (req, res) => {

    req.session.destroy(() => {
        res.redirect('/admin/signin');
    })
}