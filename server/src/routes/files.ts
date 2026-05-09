import { Router, Request, Response, NextFunction } from 'express';
import { listDirectory, readFile, writeFile, deleteFile, searchFiles } from '../services/fileService.js';

export const fileRouter = Router();

// List directory contents
fileRouter.get('/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dirPath = (req.query.path as string) || '.';
    const files = await listDirectory(dirPath);
    res.json(files);
  } catch (error) {
    next(error);
  }
});

// Read file content
fileRouter.get('/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ error: { message: 'Path parameter is required' } });
    }
    const result = await readFile(filePath);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Write file content
fileRouter.post('/write', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: { message: 'path and content are required' } });
    }
    await writeFile(filePath, content);
    res.json({ success: true, path: filePath });
  } catch (error) {
    next(error);
  }
});

// Upload/create file with content
fileRouter.post('/upload', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { path: filePath, content, encoding } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: { message: 'path is required' } });
    }
    const fileContent = encoding === 'base64'
      ? Buffer.from(content, 'base64').toString('utf-8')
      : content || '';
    await writeFile(filePath, fileContent);
    res.json({ success: true, path: filePath });
  } catch (error) {
    next(error);
  }
});

// Delete file
fileRouter.delete('/delete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ error: { message: 'Path parameter is required' } });
    }
    await deleteFile(filePath);
    res.json({ success: true, path: filePath });
  } catch (error) {
    next(error);
  }
});

// Search files
fileRouter.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rootPath = (req.query.root as string) || '.';
    const query = (req.query.q as string) || '';
    const results = await searchFiles(rootPath, query);
    res.json(results);
  } catch (error) {
    next(error);
  }
});
