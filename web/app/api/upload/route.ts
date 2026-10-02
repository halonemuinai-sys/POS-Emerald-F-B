import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada file yang diunggah.' },
        { status: 400 }
      );
    }

    const uploadsDir = path.resolve(process.cwd(), '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const savedFiles: string[] = [];
    for (const file of files) {
      // Validate file extension
      const ext = path.extname(file.name).toLowerCase();
      if (ext !== '.xls' && ext !== '.xlsx') {
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const targetPath = path.join(uploadsDir, file.name);
      fs.writeFileSync(targetPath, buffer);
      savedFiles.push(targetPath);
    }

    if (savedFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Hanya file Excel (.xls atau .xlsx) yang didukung.' },
        { status: 400 }
      );
    }

    // Now trigger the importer for the uploads folder
    const scriptPath = path.resolve(process.cwd(), '..', 'importer.py');
    const parentDir = path.resolve(process.cwd(), '..');

    const cmd = `python "${scriptPath}"`;

    const output = await new Promise<string>((resolve, reject) => {
      exec(cmd, { cwd: parentDir }, (error, stdout, stderr) => {
        if (error) {
          resolve(stdout + '\n' + stderr + '\n' + error.message);
        } else {
          resolve(stdout);
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengunggah ${savedFiles.length} file dan memproses ke PostgreSQL.`,
      savedCount: savedFiles.length,
      output
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
