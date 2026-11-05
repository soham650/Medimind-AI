import { adminService } from './admin.service';

/**
 * Backward-compatible re-export of adminService
 * Directs all legacy imports to the consolidated production admin.service.js
 */
export { adminService };
export default adminService;
