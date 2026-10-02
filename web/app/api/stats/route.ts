import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Overall counts
    const fileCountRes = await query('SELECT COUNT(*) FROM imported_files;');
    const trxCountRes = await query('SELECT COUNT(*) FROM pos_transactions;');
    const outletCountRes = await query('SELECT COUNT(*) FROM outlets;');
    const coaCountRes = await query('SELECT COUNT(*) FROM chart_of_accounts;');

    // 2. Financial totals
    const finRes = await query(`
      SELECT 
        COALESCE(SUM(debet), 0) AS total_debet,
        COALESCE(SUM(credit), 0) AS total_credit,
        COALESCE(SUM(CASE WHEN trx_type LIKE 'POSSTOCK%' THEN debet ELSE 0 END), 0) AS total_cogs,
        COALESCE(SUM(CASE WHEN trx_type = 'SALES_INVOICE_SI' THEN debet ELSE 0 END), 0) AS total_sales_discount,
        COALESCE(SUM(CASE WHEN account_code = '8300.04.01' THEN debet ELSE 0 END), 0) AS total_edc_commission
      FROM pos_transactions;
    `);

    // 3. Top Outlets
    const topOutletsRes = await query(`
      SELECT 
        location_name,
        COUNT(*) AS total_trx,
        SUM(CASE WHEN trx_type LIKE 'POSSTOCK%' THEN debet ELSE 0 END) AS total_cogs
      FROM pos_transactions
      WHERE location_name IS NOT NULL AND location_name != ''
      GROUP BY location_name
      ORDER BY total_trx DESC
      LIMIT 6;
    `);

    // 4. Transaction Types breakdown
    const trxTypesRes = await query(`
      SELECT 
        trx_type,
        COUNT(*) AS total_count,
        SUM(debet) AS total_debet
      FROM pos_transactions
      GROUP BY trx_type
      ORDER BY total_count DESC;
    `);

    // 5. Top Products sold
    const topProductsRes = await query(`
      SELECT 
        item_name,
        SUM(quantity) AS total_qty,
        SUM(debet) AS total_amount
      FROM pos_transactions
      WHERE trx_type = 'SALES_INVOICE_SI' AND item_name IS NOT NULL AND item_name != ''
      GROUP BY item_name
      ORDER BY total_qty DESC
      LIMIT 6;
    `);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalFiles: parseInt(fileCountRes.rows[0].count),
          totalTransactions: parseInt(trxCountRes.rows[0].count),
          totalOutlets: parseInt(outletCountRes.rows[0].count),
          totalCoas: parseInt(coaCountRes.rows[0].count),
          totalDebet: parseFloat(finRes.rows[0].total_debet),
          totalCredit: parseFloat(finRes.rows[0].total_credit),
          totalCogs: parseFloat(finRes.rows[0].total_cogs),
          totalSalesDiscount: parseFloat(finRes.rows[0].total_sales_discount),
          totalEdcCommission: parseFloat(finRes.rows[0].total_edc_commission),
        },
        topOutlets: topOutletsRes.rows,
        trxTypes: trxTypesRes.rows,
        topProducts: topProductsRes.rows,
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
