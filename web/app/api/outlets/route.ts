import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        o.location_name,
        o.outlet_type,
        o.city,
        COUNT(t.id) AS total_trx,
        COALESCE(SUM(CASE WHEN t.trx_type LIKE 'POSSTOCK%' THEN t.debet ELSE 0 END), 0) AS total_cogs,
        COALESCE(SUM(CASE WHEN t.trx_type = 'SALES_INVOICE_SI' THEN t.debet ELSE 0 END), 0) AS total_sales_discount,
        COALESCE(SUM(CASE WHEN t.account_code = '8300.04.01' THEN t.debet ELSE 0 END), 0) AS total_card_comm
      FROM outlets o
      LEFT JOIN pos_transactions t ON o.location_name = t.location_name
      GROUP BY o.location_name, o.outlet_type, o.city
      ORDER BY total_trx DESC;
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
