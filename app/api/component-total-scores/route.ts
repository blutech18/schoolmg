import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '../../lib/db';

// GET - Fetch component total scores for a subject
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('userSession');
    
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const classType = searchParams.get('classType') || 'LECTURE';

    if (!subjectId) {
      return NextResponse.json({ success: false, error: 'Subject ID is required' }, { status: 400 });
    }

    // Get component total scores for the subject
    const [componentRows]: any = await db.query(
      `SELECT ComponentTotalScoreID, ComponentName, TotalScore, Weight, Items, ClassType
       FROM component_total_scores 
       WHERE SubjectID = ? AND ClassType = ?
       ORDER BY ComponentName`,
      [subjectId, classType]
    );

    return NextResponse.json({
      success: true,
      data: componentRows
    });
  } catch (error) {
    console.error('Error fetching component total scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch component total scores' },
      { status: 500 }
    );
  }
}

// POST - Create or update component total scores
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('userSession');
    
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const body = await request.json();
    const { subjectId, classType, components } = body;

    if (!subjectId || !classType || !components || !Array.isArray(components)) {
      return NextResponse.json(
        { success: false, error: 'Subject ID, class type, and components array are required' },
        { status: 400 }
      );
    }

    // Validate components data
    for (const component of components) {
      if (!component.ComponentName || 
          typeof component.TotalScore !== 'number' || 
          typeof component.Weight !== 'number' || 
          typeof component.Items !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Invalid component data format' },
          { status: 400 }
        );
      }
    }

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Delete existing configurations for this subject and class type
      await db.query(
        'DELETE FROM component_total_scores WHERE SubjectID = ? AND ClassType = ?',
        [subjectId, classType]
      );

      // Insert new configurations
      for (const component of components) {
        await db.query(
          `INSERT INTO component_total_scores 
           (SubjectID, ComponentName, TotalScore, Weight, Items, ClassType)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            subjectId,
            component.ComponentName,
            component.TotalScore,
            component.Weight,
            component.Items,
            classType
          ]
        );
      }

      await db.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Component total scores updated successfully'
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating component total scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update component total scores' },
      { status: 500 }
    );
  }
}

// PUT - Update a single component total score
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('userSession');
    
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const body = await request.json();
    const { subjectId, classType, componentName, totalScore } = body;

    if (!subjectId || !classType || !componentName || typeof totalScore !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Subject ID, class type, component name, and total score are required' },
        { status: 400 }
      );
    }

    // Update the component total score
    const result = await db.query(
      `UPDATE component_total_scores 
       SET TotalScore = ?, UpdatedAt = NOW()
       WHERE SubjectID = ? AND ClassType = ? AND ComponentName = ?`,
      [totalScore, subjectId, classType, componentName]
    );

    return NextResponse.json({
      success: true,
      message: 'Component total score updated successfully'
    });
  } catch (error) {
    console.error('Error updating component total score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update component total score' },
      { status: 500 }
    );
  }
}

// DELETE - Delete component total scores for a subject
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('userSession');
    
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const classType = searchParams.get('classType');

    if (!subjectId) {
      return NextResponse.json(
        { success: false, error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    // Delete component total scores
    await db.query(
      'DELETE FROM component_total_scores WHERE SubjectID = ? AND ClassType = ?',
      [subjectId, classType || 'LECTURE']
    );

    return NextResponse.json({
      success: true,
      message: 'Component total scores deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting component total scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete component total scores' },
      { status: 500 }
    );
  }
}
