import { db } from '@/app/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, hashPassword } from '@/app/lib/passwords'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Missing email or password' }, { status: 400 })
    }

    const [rows]: any = await db.query('SELECT * FROM users WHERE EmailAddress = ? LIMIT 1', [email])
    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }
    const user = rows[0]

    const ok = await verifyPassword(password, user.Password || '')
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    // Automatically upgrade legacy sha256 passwords to scrypt on successful login
    if (user.Password && user.Password.startsWith('sha256$')) {
      try {
        const newHash = await hashPassword(password)
        await db.query('UPDATE users SET Password = ? WHERE UserID = ?', [newHash, user.UserID])
        console.log(`Upgraded password for user ${user.UserID} (${email}) from sha256 to scrypt`)
      } catch (upgradeError) {
        // Log but don't fail login if upgrade fails
        console.error('Failed to upgrade password hash:', upgradeError)
      }
    }

    const payload = {
      UserID: user.UserID,
      EmailAddress: user.EmailAddress,
      FirstName: user.FirstName,
      LastName: user.LastName,
      Role: user.Role,
    }
    return NextResponse.json({ success: true, user: payload })
  } catch (err: any) {
    console.error('Login error:', err)
    console.error('Error details:', {
      message: err?.message,
      code: err?.code,
      errno: err?.errno,
      sqlState: err?.sqlState,
      sqlMessage: err?.sqlMessage
    })
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? err?.message || 'Login failed'
      : 'Login failed'
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        code: err?.code,
        errno: err?.errno,
        sqlState: err?.sqlState
      } : undefined
    }, { status: 500 })
  }
}


