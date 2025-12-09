import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import profileRouter from './routes/userRouter.js'
import auditLogRouter from './routes/auditLogRouter.js'
import batchRecordRouter from './routes/batchRecordRouter.js'
import productRouter from './routes/productRouter.js'
import authCheck from './middleware/authCheck.js'
import errorHandler from './middleware/errorHandler.js'
import { ResponseError } from './middleware/errorHandler.js'
import axios from 'axios'
import templateRouter from './routes/templateRouter.js'
import batchRecordSectionRouter from './routes/batchRecordSectionRouter.js'
import approvalRequestRouter from './routes/approvalRequestRouter.js'
import signatureRouter from './routes/signatureRouter.js'
import { PrismaClient } from '@prisma/client'
import userRouter from './routes/userRouter.js'
import dotenv from 'dotenv'
import { fakeAuth } from './middleware/fakeauth.js'

dotenv.config()

const prisma = new PrismaClient()

const app = express()
const PORT: string = process.env.PORT || "3001"
const corsOptions = {
  origin: ["http://localhost:5174", "http://localhost:5174"]
}

app.set('trust proxy', true)

app.use(cors())
app.use(express.json())
app.use(errorHandler)

app.get('/', (req: Request, res: Response) => {
  res.send('Server is running!');
});

app.use("/api/profiles", profileRouter)
app.use("/api/logs", auditLogRouter)
app.use("/api/templates", templateRouter)
app.use("/api/batchRecords", batchRecordRouter)
app.use("/api/batchRecordSections", batchRecordSectionRouter)
app.use("/api/approvalRequests", approvalRequestRouter)
app.use("/api/signatures", signatureRouter)
app.use("/api/products", productRouter)
app.use("/api/users", userRouter)
app.get('/api/config/security', (req: Request, res: Response) => {
  res.json({
    enableReauth: process.env.ENABLE_SIGNATURE_REAUTH === 'true',
    signatureMaxAgeSeconds: Number(process.env.SIGNATURE_MAX_AGE_SECONDS || 300)
  })
})

app.get("/api", (req: Request, res: Response) => {
  res.json({ message: "Server is up and running!" })
})

app.get("/api/test-approvals", async (req: Request, res: Response) => {
    try {
        console.log('Testing approval requests endpoint...');
        res.json({ message: 'Test endpoint working' });
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ error: errorMessage });
    }
})

// Chỉ bật fakeAuth khi chạy local
if (process.env.NODE_ENV === 'development') {
  app.use(fakeAuth); // phải nằm **trước các route**
}

// Các route
app.get('/api/batches', (req, res) => {
  if (!req.user?.roles.includes('Admin')) {
    return res.status(403).send('Forbidden');
  }
  res.json({ batches: [] });
});

app.listen(3001, () => console.log('Server running on port 3001'));
app.get('/debug/sections/:batchRecordId', async (req, res) => {
  const sections = await prisma.batchRecordSection.findMany({
    where: { batchRecordId: req.params.batchRecordId },
    orderBy: [{ parentSectionId: 'asc' }, { sectionId: 'asc' }]
  })
  res.json(sections)
})

app.get('/api/protected', authCheck, async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const response = await axios.get(`${process.env.AUTH0_DOMAIN}/userinfo`, {
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    })
    const userInfo = response.data
    console.log(userInfo)
    res.send(userInfo)
  } catch (error: any) {
    new ResponseError(`Accesing user details failed: ${error}`, 500)
    res.send(error.message)
  }
})

app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new ResponseError('Not found', 400)
  next(error)
})

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`)
})
