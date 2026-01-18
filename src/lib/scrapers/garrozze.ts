
import * as cheerio from 'cheerio';
import { Scraper, ScrapedProperty } from './types';

export class GarrozzeScraper implements Scraper {
  source = 'garrozze';
  baseUrl = 'https://garrozze.com';
  targetUrl = 'https://garrozze.com/';

  async scrape(): Promise<ScrapedProperty[]> {
    const properties: ScrapedProperty[] = [];
    try {
        const response = await fetch(this.targetUrl);
        if (!response.ok) throw new Error(`Failed to fetch ${this.targetUrl}`);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Garrozze structure analysis (hypothesis based on common patterns)
        // Verified: <div class="article item"><a ...>
        $('.article.item a').each((_, element) => {
            const el = $(element);
            const href = el.attr('href');
            if (!href) return;

            const container = el.closest('.article.item'); // Assuming wrapper
            // Title: Prioritize h3 text, then link title attribute
            const title = container.find('h3').text().trim() || el.attr('title') || 'Garage House';
            
            const text = container.text();
            
            let rent: number | null = null;
            const rentMatch = text.match(/([\d,]+)円/);
            if (rentMatch) rent = parseInt(rentMatch[1].replace(/,/g, ''), 10);

            let address = '';
             const addressMatch = text.match(/(東京都|神奈川県|千葉県|埼玉県)[^\s]*/);
            if (addressMatch) address = addressMatch[0];

            let prefecture = 'その他';
            if (address.includes('東京都')) prefecture = '東京都';
            else if (address.includes('神奈川県')) prefecture = '神奈川県';

             let status: 'available' | 'occupied' | 'unknown' = 'unknown';
             if (text.includes('満室')) status = 'occupied';
             else if (rent) status = 'available';

             const sourceId = href.split('/').filter(p => p).pop()!;

            properties.push({
                sourceId,
                source: this.source,
                name: title || 'Garage House',
                address,
                prefecture,
                rent,
                status,
                type: 'garage_house',
                // Debug shows standard src attribute is used
                imageUrl: container.find('img').attr('src'),
                detailUrl: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
                features: []
            });
        });
    } catch (e) {
        console.error(`Failed to scrape ${this.source}:`, e);
    }
    return properties;
  }
}
