const reports = require('../models/reportModel');

exports.getTopFruits = async (req, res, next) => {
    try {
        res.status(200).json(await reports.getTopFruits());
    } catch (error) {
        next(error);
    }
};

exports.getRevenue = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        if (!start_date || !end_date || start_date > end_date) {
            return res.status(400).json({
                message: 'Provide valid start_date and end_date in YYYY-MM-DD format'
            });
        }
        res.status(200).json(await reports.getRevenue(start_date, end_date));
    } catch (error) {
        next(error);
    }
};

exports.getHighestVolumeVendor = async (req, res, next) => {
    try {
        res.status(200).json(await reports.getHighestVolumeVendor());
    } catch (error) {
        next(error);
    }
};

exports.getStockReport = async (req, res, next) => {
    try {
        res.status(200).json(await reports.getStockReport());
    } catch (error) {
        next(error);
    }
};
