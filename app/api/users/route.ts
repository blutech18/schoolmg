import { db } from '@/app/lib/db';
import { IUser } from '@/app/models/IUser';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
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
  } catch (error) {
    console.error('GET users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
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

    // Get next prefixed ID based on role
    let nextPrefixedId: string;
    try {
      const [nextPrefixedIdResult]: any = await db.query('SELECT GetNextPrefixedID(?) as nextId', [Role]);
      nextPrefixedId = nextPrefixedIdResult[0].nextId;
    } catch (error) {
      // Fallback: Generate prefixed ID manually
      console.log('GetNextPrefixedID function not available, generating manually');
      const prefixMap: {[key: string]: string} = {
        'admin': 'ad',
        'instructor': 'ins',
        'student': 'st',
        'dean': 'dn',
        'programcoor': 'pc'
      };
      const prefix = prefixMap[Role] || 'us';
      
      // Get max number for this role
      const [existingResult]: any = await db.query(
        `SELECT MAX(CAST(SUBSTRING(PrefixedID, ${prefix.length + 1}) AS UNSIGNED)) as maxNum 
         FROM users WHERE PrefixedID LIKE ?`,
        [`${prefix}%`]
      );
      const nextNum = (existingResult[0].maxNum || 0) + 1;
      nextPrefixedId = `${prefix}${nextNum}`;
    }

    // Determine the next UserID based on role (using correct role names)
    let nextUserId: number;

    if (Role === 'instructor') {
      // Instructors now start from 1000
      const [maxInstructorResult]: any = await db.query(
        'SELECT MAX(UserID) as maxId FROM users WHERE Role = "instructor"'
      );
      nextUserId = Math.max((maxInstructorResult[0].maxId || 999) + 1, 1000);
    } else if (Role === 'student') {
      // Students now start from 100000
      const [maxStudentResult]: any = await db.query(
        'SELECT MAX(UserID) as maxId FROM users WHERE Role = "student"'
      );
      nextUserId = Math.max((maxStudentResult[0].maxId || 99999) + 1, 100000);
    } else {
      // Admin/Dean/Coordinator use range 1-999
      const [maxAdminResult]: any = await db.query(
        'SELECT MAX(UserID) as maxId FROM users WHERE Role IN ("admin", "dean", "programcoor")'
      );
      nextUserId = Math.max((maxAdminResult[0].maxId || 0) + 1, 1);
      // Ensure it doesn't exceed 999
      if (nextUserId >= 1000) {
        throw new Error('Admin user ID range (1-999) is full');
      }
    }

    // Hash password before saving
    const { hashPassword, isHashed } = await import('@/app/lib/passwords')
    const passwordToStore = isHashed(Password) ? Password : await hashPassword(Password)

    const insertQuery = `
      INSERT INTO users
        (UserID, PrefixedID, FirstName, LastName, MiddleName, EmailAddress, Password, Sex, Role, Status, IsPWD, ContactNumber)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

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

    return NextResponse.json({
      message: `${Role} added successfully`,
      UserID: nextUserId,
      PrefixedID: nextPrefixedId
    });
  } catch (err) {
    console.error('POST user error:', err);
    return NextResponse.json({ 
      error: 'Failed to create user',
      details: err instanceof Error ? err.message : 'Unknown error'
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
