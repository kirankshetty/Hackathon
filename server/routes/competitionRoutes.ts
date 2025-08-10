import { Router } from 'express';
import { storage } from '../storage';
import { enhancedAuth } from '../middleware/auth';
import { insertCompetitionRoundSchema } from '../../shared/schema';

const router = Router();

// Get all competition rounds
router.get('/', async (req, res) => {
  try {
    const rounds = await storage.getCompetitionRounds();
    res.json({ rounds });
  } catch (error) {
    console.error("Error fetching competition rounds:", error);
    res.status(500).json({ message: "Failed to fetch competition rounds" });
  }
});

// Get competition round by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const round = await storage.getCompetitionRoundById(id);
    
    if (!round) {
      return res.status(404).json({ message: "Competition round not found" });
    }

    res.json(round);
  } catch (error) {
    console.error("Error fetching competition round:", error);
    res.status(500).json({ message: "Failed to fetch competition round" });
  }
});

// Create competition round (Admin only)
router.post('/', enhancedAuth, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const validatedData = insertCompetitionRoundSchema.parse(req.body);
    const round = await storage.createCompetitionRound(validatedData);
    
    res.status(201).json(round);
  } catch (error) {
    console.error("Error creating competition round:", error);
    res.status(500).json({ message: "Failed to create competition round" });
  }
});

// Update competition round (Admin only)
router.put('/:id', enhancedAuth, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id } = req.params;
    const updates = req.body;
    
    const updatedRound = await storage.updateCompetitionRound(id, updates);
    res.json(updatedRound);
  } catch (error) {
    console.error("Error updating competition round:", error);
    res.status(500).json({ message: "Failed to update competition round" });
  }
});

// Delete competition round (Admin only)
router.delete('/:id', enhancedAuth, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id } = req.params;
    await storage.deleteCompetitionRound(id);
    
    res.json({ message: "Competition round deleted successfully" });
  } catch (error) {
    console.error("Error deleting competition round:", error);
    res.status(500).json({ message: "Failed to delete competition round" });
  }
});

// Get stage statistics
router.get('/stats/stages', enhancedAuth, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'jury')) {
      return res.status(403).json({ message: "Access denied" });
    }

    const stats = await storage.getStageStatistics();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching stage statistics:", error);
    res.status(500).json({ message: "Failed to fetch stage statistics" });
  }
});

// Get dashboard statistics
router.get('/stats/dashboard', enhancedAuth, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'jury')) {
      return res.status(403).json({ message: "Access denied" });
    }

    const stats = await storage.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    res.status(500).json({ message: "Failed to fetch dashboard statistics" });
  }
});

export { router as competitionRoutes };