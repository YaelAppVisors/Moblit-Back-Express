const mongoose = require("mongoose");

const isEmptyValue = (value) => {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

module.exports = {isEmptyValue, isValidObjectId}