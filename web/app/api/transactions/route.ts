import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const account = searchParams.get('account') || '';
    const type = searchParams.get('type') || '';

    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(
        item_name ILIKE $${pIdx} OR 
        description ILIKE $${pIdx} OR 
        trx_no ILIKE $${pIdx} OR
        notes ILIKE $${pIdx}
      )`);
      values.push(`%${search}%`);
      pIdx++;
    }

    if (location) {
      conditions.push(`location_name = $${pIdx}`);
      values.push(location);
      pIdx++;
    }

    if (account) {
      conditions.push(`account_code = $${pIdx}`);
      values.push(account);
      pIdx++;
    }

    if (type) {
      conditions.push(`trx_type = $${pIdx}`);
      values.push(type);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count
    const countRes = await query(
      `SELECT COUNT(*) FROM pos_transactions ${whereClause};`,
      values
    );
    const totalCount = parseInt(countRes.rows[0].count);

    // Records
    const dataRes = await query(
      `SELECT 
        id, 
        source_file, 
        row_index, 
        trx_date, 
        period_ym, 
        account_code, 
        account_name, 
        trx_no, 
        trx_type, 
        description, 
        item_name, 
        quantity, 
        location_name, 
        user_create, 
        debet, 
        credit, 
        net_amount
      FROM pos_transactions 
      ${whereClause}
      ORDER BY id ASC
      LIMIT $${pIdx} OFFSET $${pIdx + 1};`,
      [...values, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: dataRes.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
