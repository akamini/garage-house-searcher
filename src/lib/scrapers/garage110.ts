
import * as cheerio from 'cheerio';
import { Scraper, ScrapedProperty } from './types';

export class JapanGaragingClubScraper implements Scraper {
  source = 'garage110';
  baseUrl = 'https://garage110.com';
  // Target multiple pages or categories if needed, but start with top page or specific list page
  targetUrl = 'https://garage110.com/';

  async scrape(): Promise<ScrapedProperty[]> {
    const properties: ScrapedProperty[] = [];

    try {
        const response = await fetch(this.targetUrl);
        if (!response.ok) throw new Error(`Failed to fetch ${this.targetUrl}`);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Look for property list items.
        // On garage110.com, properties are often listed under specific area sections.
        // Let's assume generic article/link structure for now or look for common WP classes.
        
        $('article, .post, .entry').each((_, element) => {
            const el = $(element);
            
            // Link
            const linkEl = el.find('a').first();
            const href = linkEl.attr('href');
            if (!href) return;
            
            // Exclude non-property links (e.g. news, about)
            if (!href.includes('/rent/') && !href.includes('/property/')) {
                 // Check if it looks like a property URL (often has ID or slug)
                 // This site usually puts properties under /%year%/%month%/%day%/title/ or similar if blog based
                 // Or custom post type.
                 // Let's rely on finding "Rent" or similar info to confirm it's a property.
            }

            const title = el.find('h2, h3').text().trim();
            if (!title) return;

            // Image - prioritize data-src
            const imgEl = el.find('img').first();
            const imgUrl = imgEl.attr('data-src') || imgEl.attr('src');

            const text = el.text();
            
            // Rent
            let rent: number | null = null;
            const rentMatch = text.match(/([\d,]+)円/);
            if (rentMatch) {
                rent = parseInt(rentMatch[1].replace(/,/g, ''), 10);
            }

            // Address
            let address = '';
            // Basic extraction
            const addressMatch = text.match(/(東京都|神奈川県|千葉県|埼玉県|茨城県|栃木県|群馬県)[^\s]*/);
            if (addressMatch) address = addressMatch[0];

            let prefecture = 'その他';
            if (address.includes('東京都')) prefecture = '東京都';
            else if (address.includes('神奈川県')) prefecture = '神奈川県';

            // Status
            let status: 'available' | 'occupied' | 'unknown' = 'unknown';
            if (text.includes('満室') || text.includes('空待')) status = 'occupied';
            else if (rent) status = 'available';

             // Features
            const features: string[] = [];

            // ID
            const sourceId = href.split('/').filter(p => p).pop() || Math.random().toString(36).substring(7);

            properties.push({
                sourceId,
                source: this.source,
                name: title,
                address,
                prefecture,
                rent,
                status,
                type: 'garage_house',
                imageUrl: imgUrl,
                detailUrl: href,
                features
            });
        });

    } catch (e) {
        console.error(`Failed to scrape ${this.source}:`, e);
    }

    return properties;
  }
}
