
import * as cheerio from 'cheerio';
import { Scraper, ScrapedProperty } from './types';

export class GarageHouseBizScraper implements Scraper {
  source = 'garagehouse-biz';
  baseUrl = 'https://garagehouse-biz.jp';

  targetUrl = 'https://garagehouse-biz.jp/';

  async scrape(): Promise<ScrapedProperty[]> {
    const properties: ScrapedProperty[] = [];
    
    try {
        const response = await fetch(this.targetUrl);
        if (!response.ok) throw new Error(`Failed to fetch ${this.targetUrl}`);
        
        const html = await response.text();
        const $ = cheerio.load(html);

        // Based on previous analysis, properties are likely in a list or grid
        // Looking for links containing "/list/" which seems to be the detail pattern
        // Or specific classes like .post-list, .archive-list
        
        // Let's try to find elements that link to property details
        $('a[href*="/list/"]').each((_, element) => {
            const el = $(element);
            const href = el.attr('href');
            if (!href) return;

            // Avoid duplicates if multiple links point to same property in one block
            // usually we iterate over a container <li> or <div>
            // But let's assume the <a> tag wraps the card or is the main title
            
            // sourceId from URL 
            // https://garagehouse-biz.jp/list/3441g/ -> 3441g
            const urlParts = href.split('/').filter(p => p);
            const sourceId = urlParts[urlParts.length - 1];

            // Check if we already added this ID (in case of multiple links)
            if (properties.some(p => p.sourceId === sourceId)) return;

            // In many WP themes, the <a> wraps the content.
            // Image - prioritize data-src for lazy loading
            const imgEl = el.find('img').first();
            const imageUrl = imgEl.attr('data-src') || imgEl.attr('src');

            // Text content extraction
            // The text usually contains "Title", "Rent", "Address"
            const text = el.text();
            
            // Title might be in a specific heading
            const title = el.find('h3, h4, .title').first().text().trim() || text.split('\n')[0].trim();
            const name = title.substring(0, 100); // Truncate if too long

            // Rent
            let rent: number | null = null;
            const rentMatch = text.match(/([\d,]+)円/);
            if (rentMatch) {
                rent = parseInt(rentMatch[1].replace(/,/g, ''), 10);
            }

            // Address
            let address = '';
            const addressMatch = text.match(/(東京都|神奈川県|千葉県|埼玉県|茨城県|栃木県|群馬県)[^\s]*/);
            if (addressMatch) {
                address = addressMatch[0];
            }

            // Prefecture
            let prefecture = 'その他';
            if (address) {
                if (address.includes('東京都')) prefecture = '東京都';
                else if (address.includes('神奈川県')) prefecture = '神奈川県';
                else if (address.includes('千葉県')) prefecture = '千葉県';
                else if (address.includes('埼玉県')) prefecture = '埼玉県';
                else if (address.includes('茨城県')) prefecture = '茨城県';
                else if (address.includes('栃木県')) prefecture = '栃木県';
            }

            // Status
            // Look for "満室", "募集中", "空室待ち"
            let status: 'available' | 'occupied' | 'unknown' = 'unknown';
            if (text.includes('満室') || text.includes('空室待ち')) {
                status = 'occupied';
            } else if (text.includes('募集中') || (rent && rent > 0)) {
                status = 'available';
            }
            
            // Features
            const features: string[] = [];
            if (text.includes('車')) features.push('駐車場あり');

            properties.push({
                sourceId,
                source: this.source,
                name,
                address,
                prefecture,
                rent,
                status,
                type: 'garage_house',
                imageUrl,
                detailUrl: href,
                features
            });
        });

    } catch (error) {
        console.error(`Failed to scrape ${this.source}:`, error);
    }

    return properties;
  }
}
