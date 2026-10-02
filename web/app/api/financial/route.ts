import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedYear = searchParams.get('year') || '2023';

    // 1. Fetch distinct available years
    const yearsRes = await query(`
      SELECT DISTINCT substring(period_ym, 1, 4) as yr 
      FROM monthly_trial_balance 
      WHERE period_ym IS NOT NULL AND length(period_ym) >= 4
      ORDER BY yr DESC;
    `);
    const availableYears = yearsRes.rows.map((r: any) => r.yr);

    // 2. Helper to fetch P&L data for a specific year
    const fetchYearPL = async (year: string) => {
      const yearClause = year !== 'ALL' ? `AND b.period_ym LIKE '${year}%'` : '';
      const sql = `
        SELECT 
          c.account_series,
          c.account_category,
          COALESCE(SUM(b.debet), 0) as debet,
          COALESCE(SUM(b.credit), 0) as credit
        FROM monthly_trial_balance b
        JOIN chart_of_accounts c ON b.account_code = c.account_code
        WHERE 1=1 ${yearClause}
        GROUP BY c.account_series, c.account_category;
      `;
      const res = await query(sql);

      let gross_sales = 0;
      let sales_discounts = 0;
      let cogs_cafe = 0;
      let cogs_retail = 0;
      let opex_personnel = 0;
      let opex_marketing = 0;
      let opex_ga = 0;
      let opex_card_comm = 0;
      let opex_depreciation = 0;
      let opex_mgmt_fee = 0;
      let opex_other = 0;
      let other_income_exp = 0;

      for (const r of res.rows) {
        const series = r.account_series;
        const cat = r.account_category;
        const deb = parseFloat(r.debet);
        const cre = parseFloat(r.credit);

        if (series.startsWith('4')) {
          gross_sales += (cre - deb);
        } else if (series === '5000') {
          sales_discounts += (deb - cre);
        } else if (series === '7000') {
          if (cat.includes('Retail')) {
            cogs_retail += (deb - cre);
          } else {
            cogs_cafe += (deb - cre);
          }
        } else if (series === '8100') {
          opex_personnel += (deb - cre);
        } else if (series === '8200') {
          opex_marketing += (deb - cre);
        } else if (series === '8300') {
          if (cat.includes('Card Commission')) {
            opex_card_comm += (deb - cre);
          } else {
            opex_ga += (deb - cre);
          }
        } else if (series === '8400') {
          opex_depreciation += (deb - cre);
        } else if (series === '9000') {
          opex_mgmt_fee += (deb - cre);
        } else if (series === '8000' || series.startsWith('89')) {
          opex_other += (deb - cre);
        } else if (series === '8500') {
          other_income_exp += (cre - deb);
        }
      }

      const net_sales = gross_sales - sales_discounts;
      const total_cogs = cogs_cafe + cogs_retail;
      const gross_profit = net_sales - total_cogs;
      const gp_margin = net_sales > 0 ? (gross_profit / net_sales) * 100 : 0;

      const total_opex = opex_personnel + opex_marketing + opex_ga + opex_card_comm + opex_depreciation + opex_mgmt_fee + opex_other;
      const ebit = gross_profit - total_opex;
      const ebit_margin = net_sales > 0 ? (ebit / net_sales) * 100 : 0;

      const npbt = ebit + other_income_exp;
      const npbt_margin = net_sales > 0 ? (npbt / net_sales) * 100 : 0;

      return {
        gross_sales,
        sales_discounts,
        net_sales,
        cogs_cafe,
        cogs_retail,
        total_cogs,
        gross_profit,
        gp_margin,
        opex_personnel,
        opex_marketing,
        opex_ga,
        opex_card_comm,
        opex_depreciation,
        opex_mgmt_fee,
        opex_other,
        total_opex,
        ebit,
        ebit_margin,
        other_income_exp,
        npbt,
        npbt_margin
      };
    };

    const currentPL = await fetchYearPL(selectedYear);

    // 3. Prior Year for YoY comparison (if a single year is selected)
    let priorPL = null;
    let yoy = null;
    if (selectedYear !== 'ALL') {
      const priorYearNum = parseInt(selectedYear) - 1;
      const priorYearStr = priorYearNum.toString();
      if (availableYears.includes(priorYearStr)) {
        priorPL = await fetchYearPL(priorYearStr);
        const calcGrowth = (curr: number, prev: number) => {
          if (prev === 0) return 0;
          return ((curr - prev) / Math.abs(prev)) * 100;
        };
        yoy = {
          priorYear: priorYearStr,
          revenueGrowth: calcGrowth(currentPL.net_sales, priorPL.net_sales),
          gpGrowth: calcGrowth(currentPL.gross_profit, priorPL.gross_profit),
          opexGrowth: calcGrowth(currentPL.total_opex, priorPL.total_opex),
          ebitGrowth: calcGrowth(currentPL.ebit, priorPL.ebit),
          npbtGrowth: calcGrowth(currentPL.npbt, priorPL.npbt),
        };
      }
    }

    // 4. Monthly Trend for the selected year
    const yearClause = selectedYear !== 'ALL' ? `AND b.period_ym LIKE '${selectedYear}%'` : '';
    const monthlyRes = await query(`
      SELECT 
        b.period_ym,
        COALESCE(SUM(CASE WHEN c.account_series LIKE '4%' THEN (b.credit - b.debet) ELSE 0 END), 0) as gross_rev,
        COALESCE(SUM(CASE WHEN c.account_series = '5000' THEN (b.debet - b.credit) ELSE 0 END), 0) as disc,
        COALESCE(SUM(CASE WHEN c.account_series = '7000' THEN (b.debet - b.credit) ELSE 0 END), 0) as cogs,
        COALESCE(SUM(CASE WHEN c.account_series IN ('8000','8100','8200','8300','8400','9000') THEN (b.debet - b.credit) ELSE 0 END), 0) as opex
      FROM monthly_trial_balance b
      JOIN chart_of_accounts c ON b.account_code = c.account_code
      WHERE 1=1 ${yearClause}
      GROUP BY b.period_ym
      ORDER BY b.period_ym ASC;
    `);

    const monthlyTrend = monthlyRes.rows.map((r: any) => {
      const net = parseFloat(r.gross_rev) - parseFloat(r.disc);
      const cogs = parseFloat(r.cogs);
      const gp = net - cogs;
      const opex = parseFloat(r.opex);
      const ebit = gp - opex;
      return {
        period_ym: r.period_ym,
        net_revenue: net,
        cogs,
        gross_profit: gp,
        opex,
        ebit,
        gp_margin: net > 0 ? (gp / net) * 100 : 0
      };
    });

    // 5. Balance Sheet (Latest ending balances for selected year)
    const latestPeriodSubquery = selectedYear !== 'ALL' 
      ? `SELECT MAX(period_ym) FROM monthly_trial_balance WHERE period_ym LIKE '${selectedYear}%'`
      : `SELECT MAX(period_ym) FROM monthly_trial_balance`;

    const bsRes = await query(`
      SELECT 
        c.account_series,
        c.account_category,
        COALESCE(SUM(b.ending_balance), 0) as ending_bal
      FROM monthly_trial_balance b
      JOIN chart_of_accounts c ON b.account_code = c.account_code
      WHERE b.period_ym = (${latestPeriodSubquery})
        AND c.account_series IN ('1100', '1200', '2100', '2200', '2300', '2800', '2900', '3100')
      GROUP BY c.account_series, c.account_category
      ORDER BY c.account_series;
    `);

    let cash_bank = 0;
    let receivables_inventory = 0;
    let liabilities_ap = 0;
    let liabilities_other = 0;
    let equity = 0;

    for (const r of bsRes.rows) {
      const s = r.account_series;
      const val = parseFloat(r.ending_bal);
      if (s === '1100') cash_bank += val;
      else if (s === '1200') receivables_inventory += val;
      else if (s === '2100') liabilities_ap += val;
      else if (['2200', '2300', '2800', '2900'].includes(s)) liabilities_other += val;
      else if (s === '3100') equity += val;
    }

    const total_assets = cash_bank + receivables_inventory;
    const total_liabilities = liabilities_ap + liabilities_other;

    const balanceSheet = {
      cash_bank,
      receivables_inventory,
      total_assets,
      liabilities_ap,
      liabilities_other,
      total_liabilities,
      equity,
      total_liabilities_and_equity: total_liabilities + equity
    };

    // 6. Trial Balance Accounts List (grouped by account for table view)
    const tbRes = await query(`
      SELECT 
        b.account_code,
        c.account_name,
        c.account_series,
        c.account_category,
        COALESCE(SUM(b.beginning_balance), 0) as beginning,
        COALESCE(SUM(b.debet), 0) as debet,
        COALESCE(SUM(b.credit), 0) as credit,
        COALESCE(SUM(b.ending_balance), 0) as ending
      FROM monthly_trial_balance b
      JOIN chart_of_accounts c ON b.account_code = c.account_code
      WHERE 1=1 ${yearClause}
      GROUP BY b.account_code, c.account_name, c.account_series, c.account_category
      ORDER BY b.account_code ASC;
    `);

    return NextResponse.json({
      success: true,
      data: {
        selectedYear,
        availableYears,
        pl: currentPL,
        priorPL,
        yoy,
        monthlyTrend,
        balanceSheet,
        trialBalanceAccounts: tbRes.rows.map((r: any) => ({
          account_code: r.account_code,
          account_name: r.account_name,
          account_series: r.account_series,
          account_category: r.account_category,
          beginning: parseFloat(r.beginning),
          debet: parseFloat(r.debet),
          credit: parseFloat(r.credit),
          ending: parseFloat(r.ending)
        }))
      }
    });

  } catch (error: any) {
    console.error('API Financial Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
