import { db } from '@/app/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, isHashed } from '@/app/lib/passwords'
import { cookies } from 'next/headers'

// Get user session helper
async function getUserSession() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('userSession')
    if (!sessionCookie) return null
    
    const sessionData = JSON.parse(sessionCookie.value)
    return sessionData
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    // Require admin authentication
    const session = await getUserSession()
    if (!session || !['admin'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const [rows]: any = await db.query('SELECT UserID, Password FROM users')
    let updated = 0
    let skipped = 0
    
    for (const row of rows as any[]) {
      const pwd: string = row.Password || ''
      if (!isHashed(pwd)) {
        const hashed = await hashPassword(pwd)
        await db.query('UPDATE users SET Password = ? WHERE UserID = ?', [hashed, row.UserID])
        updated++
      } else {
        skipped++
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      updated, 
      skipped,
      total: rows.length,
      message: `Updated ${updated} password(s), ${skipped} already hashed` 
    })
  } catch (err) {
    console.error('Hash passwords migration error:', err)
    return NextResponse.json({ success: false, error: 'Migration failed' }, { status: 500 })
  }
}


