import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Google GenAI initialization
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Lazy S3 Client initialization
let s3Client: S3Client | null = null;
function getS3Client(): S3Client {
  if (!s3Client) {
    const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      throw new Error('Cloudflare R2 credentials are not configured in environment variables.');
    }
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

// Data persistence file path
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'mathorg_store.json');

function readStoredData(): Record<string, any> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading store:', err);
  }
  return {};
}

function writeStoredData(data: Record<string, any>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing store:', err);
  }
}

// API: Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: Client Configuration (Supabase & Service Status)
app.get('/api/config', (req: Request, res: Response) => {
  const sanitize = (val?: string) => {
    if (!val) return '';
    let cleaned = val.trim();
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    return cleaned;
  };

  const supabaseUrl = sanitize(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
  const supabaseAnonKey = sanitize(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);

  res.json({
    supabaseUrl,
    supabaseAnonKey,
    hasSupabase: Boolean(supabaseUrl && supabaseAnonKey),
    hasR2: Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID),
    hasGemini: Boolean(process.env.GEMINI_API_KEY),
  });
});

// PWA / TWA Digital Asset Links for Android Trusted Web Activities
app.get('/.well-known/assetlinks.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.matthorg.app',
        sha256_cert_fingerprints: [
          '14:6D:E9:7D:0F:52:AB:3A:D4:6D:C2:59:79:A1:0C:6D:23:2D:33:EE:51:7A:AC:70:C6:16:D4:2D:10:98:C0:DC'
        ]
      }
    }
  ]);
});

// API: Sync data
app.get('/api/store/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const allData = readStoredData();
  const userData = allData[userId] || null;
  res.json({ success: true, data: userData });
});

app.post('/api/store/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const payload = req.body;
  const allData = readStoredData();
  allData[userId] = payload;
  writeStoredData(allData);
  res.json({ success: true, savedAt: new Date().toISOString() });
});

// API: Generate Cloudflare R2 Presigned URL
app.post('/api/storage/presigned-url', async (req: Request, res: Response) => {
  try {
    const { fileName, fileType } = req.body;
    
    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }

    const { R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env;
    if (!R2_BUCKET_NAME || !R2_PUBLIC_URL) {
      return res.status(500).json({ error: 'Storage is not configured on the server.' });
    }

    const client = getS3Client();
    
    // Generate a unique file key
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const extension = fileName.split('.').pop();
    const key = `uploads/${Date.now()}-${uniqueId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;

    res.json({
      success: true,
      uploadUrl: signedUrl,
      key,
      publicUrl,
    });
  } catch (err: any) {
    console.error('Error generating presigned URL:', err);
    res.status(500).json({ error: err.message || 'Failed to generate upload URL' });
  }
});

// API: AI Quote Assistant
app.post('/api/ai/draft-quote', async (req: Request, res: Response) => {
  try {
    const { prompt, catalogue = [], currency = '₦', plan = 'free', usedCount = 0 } = req.body;

    // AI quota limit check
    const limits: Record<string, number> = {
      free: 3,
      pro: 50,
      business: 200,
    };
    const maxAllowed = limits[plan] || 3;
    if (usedCount >= maxAllowed) {
      return res.status(403).json({
        error: "You've used all your AI generations for this month.",
        quotaExceeded: true,
        limit: maxAllowed,
        usedCount,
      });
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide customer requirements prompt.' });
    }

    const ai = getAIClient();

    // Prepare system instructions and catalogue reference
    const catalogueSummary = catalogue.length > 0
      ? catalogue.map((p: any) => `- Name: "${p.name}", Category: "${p.category || 'General'}", Default Price: ${p.default_price || 0}, Unit: "${p.unit || 'unit'}", Description: "${p.description || ''}"`).join('\n')
      : 'No saved products in catalogue yet.';

    const systemInstruction = `You are Mathorg's AI Quote Assistant for small businesses, contractors, and service providers.
Given a customer's request described in natural language, produce a professional, structured draft list of recommended items/services.

CRITICAL PRICING RULES:
1. Prioritize items from the business catalogue if provided.
2. If a recommended item matches a saved catalogue item, use its exact name, description, and saved default price.
3. If no matching saved price exists in the catalogue, set unit_price to 0 (Price not set). NEVER fabricate or invent confirmed prices.
4. AI recommendations must be structured, realistic, and tailored to the trade or request.
5. Provide a realistic title, helpful notes, and any relevant technical or scope assumptions for the quote.

Business Catalogue:
${catalogueSummary}
Currency: ${currency}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Customer requirement: ${prompt}`,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Clear quote title, e.g., Solar Installation for 3-Bedroom Home',
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Product or service line item name' },
                  quantity: { type: Type.NUMBER, description: 'Quantity or hours' },
                  unit_price: { type: Type.NUMBER, description: 'Matching catalogue price or 0 if not set' },
                  description: { type: Type.STRING, description: 'Brief description or specification' },
                  isCatalogueMatch: { type: Type.BOOLEAN, description: 'True if mapped from saved catalogue' },
                },
                required: ['name', 'quantity', 'unit_price'],
              },
            },
            notes: { type: Type.STRING, description: 'Customer notes or scope overview' },
            assumptions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key assumptions made (e.g. site inspection needed, cabling estimates)',
            },
          },
          required: ['title', 'items'],
        },
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);

    return res.json({
      success: true,
      data: parsed,
      newUsedCount: usedCount + 1,
      limit: maxAllowed,
    });
  } catch (err: any) {
    console.error('Error generating AI quote draft:', err);
    return res.status(500).json({
      error: err.message || 'Failed to generate quote draft. Please review inputs and try again.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mathorg Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
