import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export const getVersions = (req: Request, res: Response) => {
  try {
    const configPath = path.join(process.cwd(), 'app_version.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    res.json(config);
  } catch (error) {
    console.error('Error reading app_version.json:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
