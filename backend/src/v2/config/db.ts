import { PrismaPg } from '@prisma/adapter-pg';
import prismaClient from '@prisma/client';
const { PrismaClient } = prismaClient;
import pg from 'pg';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

const pool = new Pool({
  connectionString,
  max: 3, // Prevent exceeding the 15 connection limit on Supabase Free Tier when running multiple workers
  idleTimeoutMillis: 30000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
export default prisma;
