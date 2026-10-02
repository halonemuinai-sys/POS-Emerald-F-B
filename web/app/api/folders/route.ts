import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const baseDir = path.resolve(process.cwd(), '..');
    const years = ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
    
    // Get list of imported files from DB
    const dbRes = await query('SELECT file_name, status, total_rows FROM imported_files;');
    const importedMap = new Map();
    dbRes.rows.forEach((r: any) => {
      importedMap.set(r.file_name, r);
    });

    const folderStats = years.map((yr) => {
      const folderPath = path.join(baseDir, yr);
      const exists = fs.existsSync(folderPath);
      let fileCount = 0;
      let totalBytes = 0;
      let importedCount = 0;
      let totalRows = 0;

      if (exists) {
        try {
          const files = fs.readdirSync(folderPath);
          files.forEach((f) => {
            if ((f.endsWith('.xls') || f.endsWith('.xlsx')) && !f.startsWith('~$')) {
              fileCount++;
              try {
                const stat = fs.statSync(path.join(folderPath, f));
                totalBytes += stat.size;
              } catch {}

              if (importedMap.has(f)) {
                importedCount++;
                totalRows += importedMap.get(f).total_rows || 0;
              }
            }
          });
        } catch {}
      }

      return {
        year: yr,
        folderPath,
        exists,
        fileCount,
        importedCount,
        totalRows,
        sizeMb: (totalBytes / (1024 * 1024)).toFixed(1),
        isComplete: fileCount > 0 && fileCount === importedCount,
      };
    });

    return NextResponse.json({
      success: true,
      data: folderStats
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
