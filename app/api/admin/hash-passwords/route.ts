import { db } from '@/app/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, isHashed } from '@/app/lib/passwords'

export async function POST(req: NextRequest) {
  try {
    // Optional simple auth: require a query token or role (skipped for brevity)
    const [rows]: any = await db.query('SELECT UserID, Password FROM users')
    let updated = 0
    for (const row of rows as any[]) {
      const pwd: string = row.Password || ''
      if (!isHashed(pwd)) {
        const hashed = await hashPassword(pwd)
        await db.query('UPDATE users SET Password = ? WHERE UserID = ?', [hashed, row.UserID])
        updated++
      }
    }
    return NextResponse.json({ success: true, updated })
  } catch (err) {
    console.error('Hash passwords migration error:', err)
    return NextResponse.json({ success: false, error: 'Migration failed' }, { status: 500 })
  }
}


