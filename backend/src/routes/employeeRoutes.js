const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
	employeesController,
	employeeDetailController,
	createEmployeeController,
	updateEmployeeController,
	deleteEmployeeController
} = require('../controllers/hrController');

const router = express.Router();

router.get('/', requireAuth, employeesController);
router.post('/', requireAuth, createEmployeeController);
router.get('/:id', requireAuth, employeeDetailController);
router.put('/:id', requireAuth, updateEmployeeController);
router.delete('/:id', requireAuth, deleteEmployeeController);

module.exports = router;
