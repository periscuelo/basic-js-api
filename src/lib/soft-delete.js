import { Prisma } from '@prisma/client'

export const softDelete = Prisma.defineExtension({
  name: 'softDelete',
  model: {
    $allModels: {
      async softDelete(args) {
        const context = Prisma.getExtensionContext(this)
        return context.update({
          where: args.where,
          data: { deletedAt: new Date() },
        })
      },
    },
  },
})

export const softDeleteMany = Prisma.defineExtension({
  name: 'softDeleteMany',
  model: {
    $allModels: {
      async softDeleteMany(args) {
        const context = Prisma.getExtensionContext(this)
        return context.updateMany({
          where: args.where,
          data: { deletedAt: new Date() },
        })
      },
    },
  },
})

export const restore = Prisma.defineExtension({
  name: 'restore',
  model: {
    $allModels: {
      async restore(args) {
        const context = Prisma.getExtensionContext(this)
        return context.update({
          where: args.where,
          data: { deletedAt: null },
        })
      },
    },
  },
})

export const restoreMany = Prisma.defineExtension({
  name: 'restoreMany',
  model: {
    $allModels: {
      async restoreMany(args) {
        const context = Prisma.getExtensionContext(this)
        return context.updateMany({
          where: args.where,
          data: { deletedAt: null },
        })
      },
    },
  },
})

export const filterSoftDeleted = Prisma.defineExtension({
  name: 'filterSoftDeleted',
  query: {
    $allModels: {
      async $allOperations({ model, args, operation, query }) {
        const modelDef = Prisma.dmmf.datamodel.models.find(m => m.name === model)
        const hasDeletedAt = modelDef?.fields.some(f => f.name === 'deletedAt')

        if (
          hasDeletedAt &&
          ['findUnique', 'findFirst', 'findMany', 'count'].includes(operation)
        ) {
          args.where ??= {}
          args.where.deletedAt ??= null
        }

        return query(args)
      },
    },
  },
})
