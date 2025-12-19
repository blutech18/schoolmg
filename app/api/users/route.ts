import { db } from '@/app/lib/db';
import { IUser } from '@/app/models/IUser';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    const email = req.nextUrl.searchParams.get('email');
    
    // Check if email exists (for email validation/generation)
    if (email) {
      const [rows]: any = await db.query('SELECT EmailAddress FROM users WHERE EmailAddress = ? LIMIT 1', [email]);
      return NextResponse.json({ exists: rows.length > 0 });
    }
    
    // Get user(s)
    let result;

    if (!id) {
      const [rows]: any = await db.query('SELECT * FROM users');
      result = rows.map((user: any) => ({
        ...user,
        IsPWD: user.IsPWD === 'Yes'
      })) as IUser[];
    } else {
      const [rows]: any = await db.query('SELECT * FROM users WHERE UserID = ?', [parseInt(id)]);
      result = rows.length ? {
        ...rows[0],
        IsPWD: rows[0].IsPWD === 'Yes'
      } : null;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('GET users error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage,
      stack: error?.stack
    });
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      FirstName,
      LastName,
      MiddleName,
      EmailAddress,
      Password,
      Sex,
      Role,
      Status,
      IsPWD,
      ContactNumber,
    } = await req.json();

    // Block admin account creation - admin accounts are not allowed to be created via API
    if (Role === 'admin') {
      return NextResponse.json({ 
        error: 'Admin account creation is not allowed',
        details: 'Admin accounts cannot be created through this interface'
      }, { status: 403 });
    }

    // Start transaction for atomic operations
    await db.query('START TRANSACTION');

    // Generate IDs via database functions using sequences
    // Prefer GetNextUserID if available; otherwise compute via NextVal directly
    let nextUserId: number
    try {
      const [idRows]: any = await db.query('SELECT GetNextUserID(?) AS uid', [Role])
      nextUserId = idRows[0].uid
    } catch {
      const thresholds: Record<string, number> = { student: 100000, instructor: 1000 }
      const threshold = thresholds[Role] ?? 1
      const seqName = Role === 'student' ? 'user_student' : Role === 'instructor' ? 'user_instructor' : 'user_admin'
      const [uidRows]: any = await db.query('SELECT GREATEST(?, NextVal(?)) AS uid', [threshold, seqName])
      nextUserId = uidRows[0].uid
    }
    
    let nextPrefixedId: string;
    try {
      const [pidRows]: any = await db.query('SELECT GetNextPrefixedID(?) AS pid', [Role])
      nextPrefixedId = pidRows[0].pid
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Failed to generate PrefixedID:', error);
      return NextResponse.json({ 
        error: 'Failed to generate user ID',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Hash password before saving
    const { hashPassword, isHashed } = await import('@/app/lib/passwords')
    const passwordToStore = isHashed(Password) ? Password : await hashPassword(Password)

    const insertQuery = `
      INSERT INTO users
        (UserID, PrefixedID, FirstName, LastName, MiddleName, EmailAddress, Password, Sex, Role, Status, IsPWD, ContactNumber)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      await db.query(insertQuery, [
        nextUserId,
        nextPrefixedId,
        FirstName,
        LastName,
        MiddleName,
        EmailAddress,
        passwordToStore,
        Sex,
        Role,
        Status,
        IsPWD ? 'Yes' : 'No',
        ContactNumber || null
      ]);
    } catch (error: any) {
      await db.query('ROLLBACK');
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('uq_users_prefixed')) {
          return NextResponse.json({ 
            error: 'Duplicate PrefixedID detected. Please try again.',
            details: 'A user with this ID already exists'
          }, { status: 409 });
        }
        if (error.message.includes('EmailAddress')) {
          return NextResponse.json({ 
            error: 'Email already exists',
            details: 'This email address is already in use'
          }, { status: 409 });
        }
      }
      console.error('Failed to insert user:', error);
      return NextResponse.json({ 
        error: `Failed to add ${Role}`,
        details: error.message || 'Unknown error'
      }, { status: 500 });
    }

    // Commit transaction
    await db.query('COMMIT');

    return NextResponse.json({
      message: `${Role} added successfully`,
      UserID: nextUserId,
      PrefixedID: nextPrefixedId
    });
  } catch (err: any) {
    await db.query('ROLLBACK').catch(() => {});
    console.error('POST user error:', err);
    return NextResponse.json({ 
      error: 'Failed to add user',
      details: err.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    const user = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Block changing role to admin or modifying existing admin accounts
    if (user.Role === 'admin') {
      return NextResponse.json({ 
        error: 'Admin role cannot be assigned',
        details: 'Admin accounts cannot be created or modified through this interface'
      }, { status: 403 });
    }

    // Check if the user being edited is an admin
    const [existingUser]: any = await db.query('SELECT Role FROM users WHERE UserID = ?', [parseInt(id)]);
    if (existingUser.length > 0 && existingUser[0].Role === 'admin') {
      return NextResponse.json({ 
        error: 'Admin accounts cannot be modified',
        details: 'Admin accounts are protected and cannot be edited through this interface'
      }, { status: 403 });
    }

    const query = `
      UPDATE users 
      SET FirstName = ?, LastName = ?, MiddleName = ?, EmailAddress = ?, Password = ?, Sex = ?, Status = ?, IsPWD = ?, Role = ?
      WHERE UserID = ?
    `;

    const { hashPassword, isHashed } = await import('@/app/lib/passwords')
    const newPassword = user.Password && !isHashed(user.Password)
      ? await hashPassword(user.Password)
      : user.Password

    const params = [
      user.FirstName,
      user.LastName,
      user.MiddleName,
      user.EmailAddress,
      newPassword,
      user.Sex,
      user.Status,
      user.IsPWD ? 'Yes' : 'No',
      user.Role,
      parseInt(id),
    ];

    await db.query(query, params);

    return NextResponse.json({ message: 'User updated' });
  } catch (error) {
    console.error('PUT users error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userIdParam = searchParams.get('id')

    if (!userIdParam) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const UserID = parseInt(userIdParam)
    console.log(`Attempting to delete user with ID: ${UserID}`)

    // Start a transaction to ensure data consistency
    await db.query('START TRANSACTION')

    try {
      // First, get the user's role to determine what related records to delete
      const [userResult]: any = await db.query('SELECT Role FROM users WHERE UserID = ?', [UserID])
      
      if (!userResult.length) {
        throw new Error('User not found')
      }

      const userRole = userResult[0].Role
      console.log(`Deleting user with role: ${userRole}`)

      // Block deletion of admin accounts
      if (userRole === 'admin') {
        await db.query('ROLLBACK')
        return NextResponse.json({ 
          error: 'Admin accounts cannot be deleted',
          details: 'Admin accounts are protected and cannot be deleted through this interface'
        }, { status: 403 })
      }

      // Delete related records based on role
      if (userRole === 'instructor') {
        // Delete instructor-related records
        await db.query('DELETE FROM attendance WHERE RecordedBy = ?', [UserID])
        console.log('Deleted attendance records recorded by instructor')

        // Delete from schedules table (instructor assignments)
        await db.query('UPDATE schedules SET InstructorID = NULL WHERE InstructorID = ?', [UserID])
        console.log('Removed instructor from schedules')

        // Delete from subjects table (instructor assignments)
        await db.query('UPDATE subjects SET InstructorID = NULL WHERE InstructorID = ?', [UserID])
        console.log('Removed instructor from subjects')

      } else if (userRole === 'student') {
        // Delete student-related records
        await db.query('DELETE FROM attendance WHERE StudentID = ?', [UserID])
        console.log('Deleted attendance records')

        await db.query('DELETE FROM enrollments WHERE StudentID = ?', [UserID])
        console.log('Deleted enrollment records')

        await db.query('DELETE FROM grades WHERE StudentID = ?', [UserID])
        console.log('Deleted grade records')

        await db.query('DELETE FROM excuse_letters WHERE StudentID = ?', [UserID])
        console.log('Deleted excuse letter records')

        await db.query('DELETE FROM students WHERE StudentID = ?', [UserID])
        console.log('Deleted student record')
      }

      // Finally, delete from users table
      await db.query('DELETE FROM users WHERE UserID = ?', [UserID])
      console.log('User deleted from users table')

      // Commit the transaction
      await db.query('COMMIT')
      console.log('Transaction committed successfully')

      return NextResponse.json({ message: `${userRole} deleted successfully` })
    } catch (deleteError) {
      // Rollback the transaction if any error occurs
      await db.query('ROLLBACK')
      console.error('Delete operation failed, transaction rolled back:', deleteError)
      throw deleteError
    }
  } catch (err) {
    console.error('DELETE user error:', err)
    return NextResponse.json({ 
      error: 'Failed to delete user', 
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
