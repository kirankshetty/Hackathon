import { Router } from 'express';
import { storage } from '../storage';
import { requireAdmin } from '../middleware/auth';
import { metricsService } from '../services/metricsService';
import { cacheService } from '../services/cacheService';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'tmp/' });

// Dashboard statistics with caching
router.get('/dashboard-stats', requireAdmin, async (req, res) => {
  try {
    const stats = await cacheService.getDashboardStats(() => 
      metricsService.getDashboardStats()
    );
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard statistics" });
  }
});

// Stage statistics with caching
router.get('/stage-stats', requireAdmin, async (req, res) => {
  try {
    const stats = await cacheService.getStageStats(() => 
      metricsService.getStageStatistics()
    );
    res.json(stats);
  } catch (error) {
    console.error("Error fetching stage stats:", error);
    res.status(500).json({ message: "Failed to fetch stage statistics" });
  }
});

// Recent activity
router.get('/recent-activity', requireAdmin, async (req, res) => {
  try {
    const activities = await storage.getRecentActivity();
    res.json(activities);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
});

// Bulk applicant selection template
router.get('/applicant-selection/template', requireAdmin, async (req, res) => {
  try {
    const template = await storage.generateApplicantSelectionTemplate();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="applicant-selection-template.xlsx"');
    
    res.send(template);
  } catch (error) {
    console.error("Error generating template:", error);
    res.status(500).json({ message: "Failed to generate template" });
  }
});

// Stage details template
router.get('/stage-details/template', requireAdmin, async (req, res) => {
  try {
    const template = await storage.generateStageDetailsTemplate();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="stage-details-template.xlsx"');
    
    res.send(template);
  } catch (error) {
    console.error("Error generating stage template:", error);
    res.status(500).json({ message: "Failed to generate stage template" });
  }
});

// Bulk upload applicant selection
router.post('/bulk-upload-selection', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await storage.processBulkApplicantSelection(req.file.path);
    
    // Invalidate caches after bulk update
    cacheService.invalidateStats();
    
    res.json(result);
  } catch (error) {
    console.error("Bulk upload selection error:", error);
    res.status(500).json({ message: "Failed to process bulk upload" });
  }
});

// Bulk upload stage details
router.post('/bulk-upload-stages', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await storage.processBulkStageDetails(req.file.path);
    
    // Invalidate caches after bulk update
    cacheService.invalidateStats();
    
    res.json(result);
  } catch (error) {
    console.error("Bulk upload stages error:", error);
    res.status(500).json({ message: "Failed to process bulk stage upload" });
  }
});

// Export data
router.get('/export/:type', requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'xlsx' } = req.query;
    
    let data;
    let filename;
    
    switch (type) {
      case 'applicants':
        data = await storage.exportApplicants();
        filename = `applicants-export-${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      case 'submissions':
        data = await storage.exportSubmissions();
        filename = `submissions-export-${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      case 'payments':
        data = await storage.exportPayments();
        filename = `payments-export-${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      default:
        return res.status(400).json({ message: "Invalid export type" });
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(data);
  } catch (error) {
    console.error(`Export error for type ${req.params.type}:`, error);
    res.status(500).json({ message: "Failed to export data" });
  }
});

// Clear cache manually
router.post('/clear-cache', requireAdmin, async (req, res) => {
  try {
    cacheService.clear();
    res.json({ message: "Cache cleared successfully" });
  } catch (error) {
    console.error("Cache clear error:", error);
    res.status(500).json({ message: "Failed to clear cache" });
  }
});

export { router as adminRoutes };