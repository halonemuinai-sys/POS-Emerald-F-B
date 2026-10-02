import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        c.account_code,
        c.account_name,
        c.account_series,
        c.account_category,
        COUNT(t.id) AS total_trx,
        COALESCE(SUM(t.debet), 0) AS total_debet,
        COALESCE(SUM(t.credit), 0) AS total_credit,
        COALESCE(SUM(t.net_amount), 0) AS total_net
      FROM chart_of_accounts c
      LEFT JOIN pos_transactions t ON c.account_code = t.account_code
      GROUP BY c.account_code, c.account_name, c.account_series, c.account_category
      ORDER BY c.account_code ASC;
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
