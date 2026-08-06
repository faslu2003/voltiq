const User = require('../src/models/User');



exports.authenticateUser = async (req, res, next) => {

    if (!req.session.user) {
        return res.redirect('/signin');
    }

    next();
}


exports.authenticateAdmin = async (req, res, next) => {

    if (!req.session.admin) {
        return res.redirect('/admin/signin');
    }

    next();
}


exports.checkBlocked = async (req, res, next) => {

    const user = await User.findById(req.session.user.id);

    if (!user || user.isBlocked) {
        delete req.session.user;
        return res.redirect('/signin');
    }

    next();
}