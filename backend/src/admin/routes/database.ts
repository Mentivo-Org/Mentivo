import type { Response } from 'express';
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/db.ts';
import { authenticateAdmin } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Introspect Prisma model names and metadata from Prisma DMMF (Data Model Meta Format)
const getAvailableTables = () => {
  // @ts-ignore - Accessing Prisma internals to dynamic metadata
  const dmmf = Prisma.dmmf;
  return dmmf.datamodel.models;
};

// Log helper
const logDBAction = async (adminEmail: string, table: string, action: string, details: any) => {
  try {
    await prisma.logEntry.create({
      data: {
        level: 'INFO',
        source: 'admin-backend',
        message: `Admin ${adminEmail} performed ${action} on ${table}`,
        metadata: {
          action,
          table,
          admin: adminEmail,
          ...details
        }
      }
    });
  } catch (err) {
    console.error('Failed to log admin action to DB:', err);
  }
};

// 1. GET /api/database/tables - List all tables/models
router.get('/tables', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const models = getAvailableTables();
    
    // Get row counts for all tables dynamically
    const tableStats = await Promise.all(
      models.map(async (model: any) => {
        const modelKey = model.name.charAt(0).toLowerCase() + model.name.slice(1);
        let count = 0;
        try {
          // @ts-ignore
          if (prisma[modelKey]) {
            // @ts-ignore
            count = await prisma[modelKey].count();
          }
        } catch (e) {
          // ignore counting error
        }
        return {
          name: model.name,
          dbName: model.dbName || model.name,
          fields: model.fields,
          rowCount: count
        };
      })
    );

    res.json(tableStats);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to list tables' });
  }
});

// 2. GET /api/database/tables/:tableName/rows - Paginated + Filtered Rows
router.get('/tables/:tableName/rows', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const { tableName } = req.params;
  const { page = '1', limit = '25', sortBy, order = 'desc', search, filters } = req.query;

  const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
  // @ts-ignore
  const dbModel = prisma[modelName];

  if (!dbModel) {
    return res.status(404).json({ error: `Table '${tableName}' not found or not accessible.` });
  }

  try {
    const take = parseInt(limit as string, 10);
    const skip = (parseInt(page as string, 10) - 1) * take;

    // Build filter query object
    const where: any = {};

    // Global Search across string columns (Introspect fields)
    const models = getAvailableTables();
    const modelMeta = models.find((m: any) => m.name.toLowerCase() === tableName.toLowerCase());
    
    if (search && modelMeta) {
      const searchConditions: any[] = [];
      modelMeta.fields.forEach((field: any) => {
        if (field.type === 'String') {
          searchConditions.push({
            [field.name]: {
              contains: search as string,
              mode: 'insensitive'
            }
          });
        }
      });
      if (searchConditions.length > 0) {
        where.OR = searchConditions;
      }
    }

    // Apply specific filters sent from UI
    if (filters) {
      const parsedFilters = JSON.parse(filters as string); // [{ field, operator, value }]
      parsedFilters.forEach((f: any) => {
        const fieldMeta = modelMeta?.fields.find((field: any) => field.name === f.field);
        if (!fieldMeta) return;

        let val: any = f.value;
        if (fieldMeta.type === 'Int') val = parseInt(f.value, 10);
        else if (fieldMeta.type === 'Float' || fieldMeta.type === 'Decimal') val = parseFloat(f.value);
        else if (fieldMeta.type === 'Boolean') val = f.value === 'true' || f.value === true;
        else if (fieldMeta.type === 'DateTime') val = new Date(f.value);

        if (f.operator === 'equals') {
          where[f.field] = val;
        } else if (f.operator === 'contains' && fieldMeta.type === 'String') {
          where[f.field] = { contains: val, mode: 'insensitive' };
        } else if (f.operator === 'gt') {
          where[f.field] = { gt: val };
        } else if (f.operator === 'lt') {
          where[f.field] = { lt: val };
        } else if (f.operator === 'not') {
          where[f.field] = { not: val };
        }
      });
    }

    // Sorting
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy as string] = order === 'asc' ? 'asc' : 'desc';
    } else if (modelMeta) {
      // Default sort by id or created_at if exists
      const hasId = modelMeta.fields.some((f: any) => f.name === 'id');
      const createdAtField = modelMeta.fields.find((f: any) => f.name === 'createdAt' || f.name === 'created_at');
      if (createdAtField) {
        orderBy[createdAtField.name] = 'desc';
      } else if (hasId) {
        orderBy.id = 'desc';
      }
    }

    // Run query count and data selection in parallel
    const [total, data] = await Promise.all([
      dbModel.count({ where }),
      dbModel.findMany({
        where,
        take,
        skip,
        orderBy
      })
    ]);

    res.json({
      total,
      page: parseInt(page as string, 10),
      limit: take,
      totalPages: Math.ceil(total / take),
      data
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Query failed' });
  }
});

// 3. POST /api/database/tables/:tableName/rows - Insert Row
router.post('/tables/:tableName/rows', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const { tableName } = req.params;
  const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
  // @ts-ignore
  const dbModel = prisma[modelName];

  if (!dbModel) {
    return res.status(404).json({ error: `Table '${tableName}' not found.` });
  }

  try {
    const data = req.body;
    const result = await dbModel.create({ data });
    
    await logDBAction(req.user?.email || 'admin', tableName, 'CREATE', { row: result });
    
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to insert row' });
  }
});

// 4. PUT /api/database/tables/:tableName/rows/:id - Update Row
router.put('/tables/:tableName/rows/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const { tableName, id } = req.params;
  const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
  // @ts-ignore
  const dbModel = prisma[modelName];

  if (!dbModel) {
    return res.status(404).json({ error: `Table '${tableName}' not found.` });
  }

  try {
    const data = req.body;
    const result = await dbModel.update({
      where: { id },
      data
    });

    await logDBAction(req.user?.email || 'admin', tableName, 'UPDATE', { id, updates: data });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update row' });
  }
});

// 5. DELETE /api/database/tables/:tableName/rows/:id - Delete Row
router.delete('/tables/:tableName/rows/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const { tableName, id } = req.params;
  const { confirmationToken } = req.query; // Security pattern
  
  if (!confirmationToken || confirmationToken !== `delete-${tableName}-${id}`) {
    return res.status(400).json({ error: 'Missing or invalid confirmation token.' });
  }

  const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
  // @ts-ignore
  const dbModel = prisma[modelName];

  if (!dbModel) {
    return res.status(404).json({ error: `Table '${tableName}' not found.` });
  }

  try {
    const result = await dbModel.delete({
      where: { id }
    });

    await logDBAction(req.user?.email || 'admin', tableName, 'DELETE', { id, deleted: result });

    res.json({ message: 'Row successfully deleted', deleted: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete row' });
  }
});

export default router;
