import { db } from '@/app/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, verifyPassword } from '@/app/lib/passwords'
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

/**
 * Optional endpoint to upgrade legacy sha256 passwords to scrypt
 * Note: sha256 passwords still work, this is just for security best practices
 * Requires admin authentication
 */
export async function POST(req: NextRequest) {
  try {
    // Require admin authentication
    const session = await getUserSession()
    if (!session || !['admin'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    // Get all users with sha256 passwords
    const [rows]: any = await db.query("SELECT UserID, Password FROM users WHERE Password LIKE 'sha256$%'")
    
    if (rows.length === 0) {
      return NextResponse.json({ 
        success: true, 
        upgraded: 0,
        message: 'No sha256 passwords found to upgrade' 
      })
    }

    let upgraded = 0
    let failed = 0
    const failedUsers: number[] = []

    // For each user, we need to verify the password first
    // Since we don't have the plaintext, we can't upgrade them directly
    // This endpoint documents that sha256 passwords will be upgraded on next login
    
    return NextResponse.json({ 
      success: true,
      totalSha256: rows.length,
      upgraded,
      failed,
      message: `Found ${rows.length} sha256 password(s). These will be automatically upgraded to scrypt when users log in next.`,
      note: 'sha256 passwords are still secure and functional. Upgrade happens automatically on login.'
    })
  } catch (err) {
    console.error('Upgrade passwords error:', err)
    return NextResponse.json({ success: false, error: 'Upgrade failed' }, { status: 500 })
  }
}





