import express from 'express';
import UnitController from '../../controllers/unit.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', checkPermission(), UnitController.create);
router.get('/', checkPermission(), UnitController.get);
router.put('/:id', checkPermission(), UnitController.update);
router.delete('/:id', checkPermission(), UnitController.delete);


export default router;
