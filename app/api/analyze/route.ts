import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { meals, dailyUsage, adminConfig } from '@/drizzle/schema'
import { verifyToken, extractToken } from '@/lib/auth'
import { getCfg, getGlobalLimit } from '@/lib/admin'
import { ok, err, setCors, todayISO } from '@/lib/utils'
import { eq, and, sql } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'

export async function OPTIONS() {
  const h = new Headers(); setCors(h)
  return new Response(null, { status: 204, headers: h })
}

export async function POST(req: NextRequest) {
  // Auth
  const token = extractToken(req.headers.get('Authorization'))
  if (!token) return err('Token diperlukan', 401)
  let payload: { userId: string; username: string }
  try {
    const p = await verifyToken(token)
    if (!p.userId) throw new Error()
    payload = { userId: p.userId, username: p.username! }
  } catch {
    return err('Token tidak valid', 401)
  }

  // Get user daily limit
  const { users } = await import('@/drizzle/schema')
  const { eq: eqOp } = await import('drizzle-orm')
  const [user] = await db.select({ dailyLimit: users.dailyLimit }).from(users)
    .where(eqOp(users.id, payload.userId)).limit(1)

  const globalLimit = await getGlobalLimit()
  const userLimit   = user?.dailyLimit ?? globalLimit
  const today       = todayISO()

  // Check daily usage
  const [usage] = await db.select().from(dailyUsage)
    .where(and(eq(dailyUsage.userId, payload.userId), eq(dailyUsage.date, today)))
    .limit(1)

  if ((usage?.count ?? 0) >= userLimit) {
    return err(`Batas analisa harian (${userLimit}x) sudah tercapai`, 429)
  }

  // Parse request
  const contentType = req.headers.get('content-type') || ''
  let imageBase64 = '', mimeType = 'image/jpeg'

  if (contentType.includes('application/json')) {
    const body = await req.json()
    imageBase64 = body.image || ''
    mimeType    = body.mimeType || 'image/jpeg'
  } else if (contentType.includes('multipart/form-data')) {
    const form  = await req.formData()
    const file  = form.get('image') as File
    if (!file) return err('Gambar diperlukan')
    const buf   = await file.arrayBuffer()
    imageBase64 = Buffer.from(buf).toString('base64')
    mimeType    = file.type || 'image/jpeg'
  } else {
    return err('Content-Type tidak didukung')
  }

  if (!imageBase64) return err('Gambar diperlukan')

  // Anthropic API Key
  const apiKey = await getCfg('anthropic_api_key') || process.env.ANTHROPIC_API_KEY
  if (!apiKey) return err('API key Anthropic belum dikonfigurasi', 503)

  // Analyze with Claude
  let analysis: any
  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType as any, data: imageBase64 },
          },
          {
            type: 'text',
            text: `Analisa gambar makanan ini dan berikan estimasi nutrisi dalam format JSON.
Jika tidak ada makanan dalam gambar, kembalikan error.

Format respons WAJIB (JSON saja, tanpa teks lain):
{
  "dishes": [
    {
      "name": "nama makanan",
      "portion": "estimasi porsi (misal: 1 piring, 200g)",
      "calories": 300,
      "protein": 15.5,
      "carbs": 40.0,
      "fat": 8.0
    }
  ],
  "total": {
    "calories": 300,
    "protein": 15.5,
    "carbs": 40.0,
    "fat": 8.0
  },
  "notes": "catatan singkat tentang nilai gizi"
}`,
          },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return err('Gagal memparse respons AI')
    analysis = JSON.parse(jsonMatch[0])
  } catch (e: any) {
    if (e.status === 401) return err('API key Anthropic tidak valid', 503)
    return err(`Analisa gagal: ${e.message}`, 500)
  }

  // Save meal
  const [meal] = await db.insert(meals).values({
    userId:        payload.userId,
    dishNames:     analysis.dishes?.map((d: any) => d.name) ?? [],
    totalCalories: Math.round(analysis.total?.calories ?? 0),
    totalProtein:  String(analysis.total?.protein ?? 0),
    totalCarbs:    String(analysis.total?.carbs ?? 0),
    totalFat:      String(analysis.total?.fat ?? 0),
    rawAnalysis:   analysis,
  }).returning()

  // Update daily usage
  await db.insert(dailyUsage)
    .values({ userId: payload.userId, date: today, count: 1 })
    .onConflictDoUpdate({
      target: [dailyUsage.userId, dailyUsage.date],
      set: { count: sql`${dailyUsage.count} + 1` },
    })

  const usedAfter = (usage?.count ?? 0) + 1
  return ok({
    meal,
    analysis,
    usage: { used: usedAfter, limit: userLimit, remaining: Math.max(0, userLimit - usedAfter) },
  })
}
