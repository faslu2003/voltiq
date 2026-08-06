const User = require('../src/models/User');

const adminService = require('../services/adminService');



exports.getSignin = (req, res) => {

    res.render('admin/signin');
}

exports.postSignin = (req, res) => {

    res.redirect('/admin/customers');
}

exports.getCustomers = async (req, res) => {

    const page = Number(req.query.page) || 1;

    const result = await adminService.getCustomers(page);

    const customers = result.customers;
    const totalCustomers = result.totalCustomers;
    const stats = result.stats;
    const pagination = result.pagination;

    res.render('admin/customers', { customers, totalCustomers, stats, pagination });
}