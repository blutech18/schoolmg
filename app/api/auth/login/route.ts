import { db } from '@/app/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword } from '@/app/lib/passwords'

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

    const payload = {
      UserID: user.UserID,
      EmailAddress: user.EmailAddress,
      FirstName: user.FirstName,
      LastName: user.LastName,
      Role: user.Role,
    }
    return NextResponse.json({ success: true, user: payload })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 })
  }
}


