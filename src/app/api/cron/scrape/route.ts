
import { NextRequest, NextResponse } from 'next/server';
import { ScraperManager } from '@/lib/scrapers/manager';

export const maxDuration = 300; // 5 minutes max for scraping

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const manager = new ScraperManager();
    await manager.session();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Scraping failed:', error);
    return NextResponse.json({ success: false, error: 'Scraping failed' }, { status: 500 });
  }
}
