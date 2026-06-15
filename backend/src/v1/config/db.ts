import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
// /**
//  * @type {PrismaClient}
//  */
const adapter = new PrismaPg({connectionString: process.env.DIRECT_URL||process.env.DATABASE_URL});
const prisma = new PrismaClient({adapter});
export default prisma;
