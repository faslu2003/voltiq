const User = require('../src/models/User');

const adminService = require('../services/adminService');



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
    catch(err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";

        res.redirect('/admin/signin');
    }
}


exports.getCustomers = async (req, res) => {

    const search = req.query.search || "";

    const page = Number(req.query.page) || 1;

    const result = await adminService.getCustomers(page, search);

    const customers = result.customers;
    const totalCustomers = result.totalCustomers;
    const stats = result.stats;
    const pagination = result.pagination;

    const error = req.session.error || null;
    req.session.error = null;

    res.render('admin/customers', { customers, totalCustomers, stats, pagination, search, error });
}

exports.upddateCustomerStatus = async (req, res) => {

    const result = await adminService.updateCustomerStatus(req.params.id, req.body.isBlocked);

    try {
        res.redirect('/admin/customers');
    }
    catch(err) {
        console.log(error);
        req.session.error = "Something went wrong. Please try again";
        res.redirect('/admin/customers');
    }
}