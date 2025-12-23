import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const pdfPath = path.join(process.cwd(), 'public', 'kiaan-wms-test-evidence-report.pdf');
  
  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="kiaan-wms-test-evidence-report.pdf"',
      },
    });
  } catch (error) {
    return new NextResponse('PDF not found', { status: 404 });
  }
}
