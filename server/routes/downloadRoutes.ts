import { Router } from 'express';
import { createReadStream } from 'fs';
import path from 'path';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Download backend code endpoint
router.get('/backend', requireAdmin, async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), 'hackathon-nodejs-complete.tar.gz');
    const fs = await import('fs/promises');
    
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Backend archive not found' });
    }

    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', 'attachment; filename="hackathon-nodejs-backend.tar.gz"');
    
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading backend code:', error);
    res.status(500).json({ error: 'Failed to download backend code' });
  }
});

// Download complete GitHub-ready project
router.get('/github-project', requireAdmin, async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), 'hackathon-hub-github-ready.tar.gz');
    const fs = await import('fs/promises');
    
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'GitHub project archive not found' });
    }

    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', 'attachment; filename="hackathon-hub-github-ready.tar.gz"');
    
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading GitHub project:', error);
    res.status(500).json({ error: 'Failed to download GitHub project' });
  }
});

// Download missing GitHub files
router.get('/missing-files', requireAdmin, async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), 'missing-github-files.tar.gz');
    const fs = await import('fs/promises');
    
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Missing files archive not found' });
    }

    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', 'attachment; filename="missing-github-files.tar.gz"');
    
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading missing files:', error);
    res.status(500).json({ error: 'Failed to download missing files' });
  }
});

export { router as downloadRoutes };