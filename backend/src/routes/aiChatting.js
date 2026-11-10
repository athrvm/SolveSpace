const express = require('express');
const aiRouter =  express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const solveDoubt = require('../controllers/solveDoubt');

aiRouter.post('/ai', userMiddleware, solveDoubt);

module.exports = aiRouter;