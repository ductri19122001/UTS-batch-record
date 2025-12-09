import type { BatchRecord } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import type { Request } from 'express';
import { ensureUserForAudit } from '../utils/ensureUserForAudit.js';

const prisma = new PrismaClient()

export async function fetchBatchRecords(): Promise<BatchRecord[]> {
    const batchRecords = await prisma.batchRecord.findMany({
        include: {
            product: true,
            creator: true,
            approver: true
        }
    })
    return batchRecords
}

export async function addBatchRecord(data: any, req?: Request): Promise<BatchRecord> {
    if (!data.templateVersionId) {
        throw new Error('templateVersionId is required')
    }
    
    if (!data.templateId) {
        throw new Error('templateId is required')
    }
    
    // Verify template version exists and belongs to the template
    try {
        const templateVersion = await prisma.templateVersion.findUnique({
            where: { id: data.templateVersionId },
            select: { id: true, templateId: true, isActive: true }
        })
        
        if (!templateVersion) {
            throw new Error(`Template version with id ${data.templateVersionId} not found`)
        }
        
        if (templateVersion.templateId !== data.templateId) {
            throw new Error(`Template version ${data.templateVersionId} does not belong to template ${data.templateId}`)
        }
        
        if (!templateVersion.isActive) {
            console.warn(`Warning: Template version ${data.templateVersionId} is not active`)
        }
    } catch (error: any) {
        console.error('Template version validation failed:', error)
        throw new Error(`Template version validation failed: ${error.message}`)
    }
    
    // Generate unique batch number if not provided
    if (!data.batchNumber) {
        const batchNumber = await generateUniqueBatchNumber(data.productId);
        data.batchNumber = batchNumber;
    }
    
    try {
        const batchRecord = await prisma.batchRecord.create({ data })
        
        if (data.createdBy) {
            const { userId: storedUserId, userExists } = await ensureUserForAudit(data.createdBy, req as any)

            const auditData: any = {
                action: 'BATCH_RECORD_CREATED',
                entityType: 'BatchRecord',
                entityId: batchRecord.id,
                newValue: {
                    batchNumber: batchRecord.batchNumber,
                    productId: batchRecord.productId,
                    templateId: batchRecord.templateId,
                    templateVersionId: batchRecord.templateVersionId,
                    status: batchRecord.status
                },
            }
            
            if (storedUserId && userExists) {
                auditData.user = { connect: { id: storedUserId } }
            } else {
                auditData.userId = storedUserId || null
            }
            
            if (batchRecord.id) {
                auditData.batch = { connect: { id: batchRecord.id } }
            }
            
            await prisma.auditLog.create({
                data: auditData
            })
        }
        
        return batchRecord
    } catch (error: any) {
        console.error('Error creating batch record:', error)
        if (error.code === 'P2002') {
            throw new Error(`Batch number ${data.batchNumber} already exists`)
        }
        if (error.code === 'P2003') {
            throw new Error(`Foreign key constraint failed: ${error.meta?.field_name || 'unknown field'}`)
        }
        throw error
    }
}

async function generateUniqueBatchNumber(productId: string): Promise<string> {
    // Get the product to extract the first two characters of productCode
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { productCode: true }
    });

    if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
    }

    // Extract first two characters of product code
    const productPrefix = product.productCode.substring(0, 2).toUpperCase();

    // Get current year
    const currentYear = new Date().getFullYear();

    // Create the base pattern for this year and product
    const basePattern = `${productPrefix}-${currentYear}-`;

    // Find the highest existing batch number for this pattern
    const existingBatches = await prisma.batchRecord.findMany({
        where: {
            batchNumber: {
                startsWith: basePattern
            }
        },
        select: { batchNumber: true },
        orderBy: { batchNumber: 'desc' }
    });

    // Extract the counter from existing batch numbers
    let nextCounter = 1;
    if (existingBatches.length > 0) {
        const lastBatchNumber = existingBatches[0]?.batchNumber;
        if (lastBatchNumber) {
            const counterPart = lastBatchNumber.substring(basePattern.length);
            const lastCounter = parseInt(counterPart, 10);
            if (!isNaN(lastCounter)) {
                nextCounter = lastCounter + 1;
            }
        }
    }

    // Format the counter with leading zeros (4 digits)
    const formattedCounter = nextCounter.toString().padStart(4, '0');
    const finalBatchNumber = `${basePattern}${formattedCounter}`;

    return finalBatchNumber;
}

export async function fetchBatchRecordById(batchRecordId: string): Promise<BatchRecord | null> {
    const batchRecord = await prisma.batchRecord.findUnique({
        where: {
            id: batchRecordId
        },
        include: {
            product: true,
            creator: true,
            approver: true
        }
    })
    return batchRecord
}
