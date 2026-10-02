import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const force = body.force === true;

    // Path to importer.py in parent directory
    const scriptPath = path.resolve(process.cwd(), '..', 'importer.py');
    const parentDir = path.resolve(process.cwd(), '..');

    const cmd = `python "${scriptPath}" ${force ? '--force' : ''}`;

    return new Promise<NextResponse>((resolve) => {
      exec(cmd, { cwd: parentDir }, (error, stdout, stderr) => {
        if (error) {
          resolve(
            NextResponse.json(
              {
                success: false,
                error: error.message,
                output: stdout + '\n' + stderr
              },
              { status: 500 }
            )
          );
        } else {
          resolve(
            NextResponse.json({
              success: true,
              output: stdout,
              message: 'Import successfully executed!'
            })
          );
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
