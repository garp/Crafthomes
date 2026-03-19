import { Router } from 'express';
import UserRoutes from './user.routes.js';
import PolicyRoutes from '../policy.routes.js';
import DesignationRoutes from './designation.routes.js';
import DepartmentRoutes from './department.routes.js';
import OrganizationRoutes from './organization.routes.js';

const router = Router();

router.use('/internal-users', UserRoutes);
router.use('/policy', PolicyRoutes);
router.use('/designation', DesignationRoutes);
router.use('/department', DepartmentRoutes);
router.use('/organization', OrganizationRoutes);

export default router;
