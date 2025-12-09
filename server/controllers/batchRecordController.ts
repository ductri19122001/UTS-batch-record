import { fetchBatchRecords, addBatchRecord, fetchBatchRecordById } from "../services/batchRecordServices.js";
import type { Response, Request } from "express";

export async function listBatchRecords(req: Request, resp: Response) {
  try {
    const batchRecords = await fetchBatchRecords()
    if (!batchRecords || !Array.isArray(batchRecords)) {
      console.warn('fetchBatchRecords returned invalid value:', batchRecords)
      return resp.status(200).json([])
    }
    return resp.status(200).json(batchRecords)
  } catch (error) {
    console.error(`Error Fetching Batch Records: \n`, error)
    return resp.status(200).json([]) // Return empty array on error to prevent client crash
  }
}

export async function getBatchRecordById(req: Request, resp: Response) {
  if (!req.params.id) {
    return resp.status(400).json({ error: "No Batch Record ID provided" })
  }

  try {
    const batchRecord = await fetchBatchRecordById(req.params.id)

    if (!batchRecord) {
      return resp.status(404).json({ error: "Batch record not found" })
    }

    return resp.status(200).json(batchRecord)
  } catch (error) {
    console.error(`Error fetching Batch Record:`, error)
    return resp.status(500).json({ error: "Fail to fetch Batch Record" })
  }
}

export const createBatchRecord = async (req: Request, resp: Response) => {
  try {
    const { productId, templateId, templateVersionId, createdBy } = req.body

    if (!productId) {
      return resp.status(400).json({ error: 'productId is required' })
    }
    if (!templateId) {
      return resp.status(400).json({ error: 'templateId is required' })
    }
    if (!templateVersionId) {
      return resp.status(400).json({ error: 'templateVersionId is required' })
    }
    if (!createdBy) {
      return resp.status(400).json({ error: 'createdBy is required' })
    }

    const batchRecord = await addBatchRecord(req.body, req)
    resp.status(201).json(batchRecord)
  } catch (error: any) {
    console.error('Error creating Batch Record:', error)
    const errorMessage = error.message || 'Failed to create Batch Record'
    const statusCode = error.message?.includes('required') || error.message?.includes('not found') || error.message?.includes('constraint') ? 400 : 500
    resp.status(statusCode).json({ error: errorMessage })
  }
}
