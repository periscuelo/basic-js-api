import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  filterSoftDeleted,
  restore,
  restoreMany,
  softDelete,
  softDeleteMany
} from './soft-delete.js'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

export const prisma = new PrismaClient({ adapter })
  .$extends(filterSoftDeleted)
  .$extends(restore)
  .$extends(restoreMany)
  .$extends(softDelete)
  .$extends(softDeleteMany)
