import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        id, 
        file_name, 
        batch_code, 
        file_size, 
        total_rows, 
        total_debet, 
        total_credit, 
        status, 
        duration_seconds, 
        error_message, 
        created_at
      FROM imported_files
      ORDER BY id ASC;
    `);

    return NextResponse.json({
      success: true,
      data: res.rows
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
