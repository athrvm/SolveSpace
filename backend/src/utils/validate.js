const validator = require('validator');


const validate = (data) => {
    const mandatoryFields = ['firstName', 'emailId', 'password'];

    const isAllowed = mandatoryFields.every(field => data.hasOwnProperty(field) && data[field] !== undefined && data[field] !== null && data[field] !== '');

    if (!isAllowed) {
        throw new Error('Missing mandatory fields');
    }

    if (!validator.isEmail(data.emailId))
        throw new Error("Invalid Email");

    if (!validator.isStrongPassword(data.password))
        throw new Error("Week Password");
}


module.exports = validate;