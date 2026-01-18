
import * as cheerio from 'cheerio';
import { Scraper, ScrapedProperty } from './types';

export class TokyoGarageScraper implements Scraper {
  source = 'tokyo-garage';
  baseUrl = 'https://tokyo-garage.jp';

  // URLs to scrape: Standard rental and Bike rental categories
  targetUrls = [
    'https://tokyo-garage.jp/category/chintai/',
    'https://tokyo-garage.jp/category/chintai/bike/'
  ];

  async scrape(): Promise<ScrapedProperty[]> {
    const allProperties: ScrapedProperty[] = [];
    const seenIds = new Set<string>();

    for (const url of this.targetUrls) {
      try {
        const properties = await this.scrapePage(url);
        for (const prop of properties) {
          if (!seenIds.has(prop.sourceId)) {
            allProperties.push(prop);
            seenIds.add(prop.sourceId);
          }
        }
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
      }
    }

    return allProperties;
  }

  private async scrapePage(url: string): Promise<ScrapedProperty[]> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    const properties: ScrapedProperty[] = [];

    // Select the article elements - adjusting selector based on typical WordPress structure observed
    // Usually <article> or .post
    // Based on previous search, it seems to have list layout. 
    // Let's assume a generic selector and refine if needed. 
    // Looking at standard WP themes often used by these sites:
    
    // Targeted selection for property grid
    // Based on debug: .property-list contains <a> tags directly which are the items
    let items = $('.property-list a.property-list__item');
    
    // If no specific properties found, try secondary classes or fallback
    if (!items.length) {
        items = $('.pg-top-newproperty__inner article, .pg-top-newproperty__inner .entry');
    }

    if (!items.length) {
         items = $('article');
    }

    items.each((_, element) => {
      const el = $(element);
      
      // Detail URL: If el is a link, use it. Otherwise find anchor.
      let detailUrl = el.attr('href');
      if (!detailUrl && el.prop('tagName') !== 'A') {
          detailUrl = el.find('a').first().attr('href');
      }

      if (!detailUrl || (!detailUrl.includes('/rent/') && !detailUrl.includes('/indoor-parking/'))) return;

      // Title
      // If el is the link, we need to find title inside it or usage alt text?
      // Debug HTML shows: <a ...><div class="figure">...</div>...</a>
      // Often title is in a separate div inside the link or just text.
      // Let's see if there is a title class inside.
      let name = el.find('.property-list__item__title, h2, h3, .title').text().trim();
      if (!name) {
          // Fallback: try image alt
          name = el.find('img').attr('alt') || '';
      }
      if (!name) name = 'Tokyo Garage Property';

      // sourceId
      const urlParts = detailUrl.split('/').filter(p => p);
      const sourceId = urlParts[urlParts.length - 1];

      // Image
      // Debug: .property-list__item__figure img
      let imgEl = el.find('.property-list__item__figure img').first();
      if (!imgEl.length) imgEl = el.find('img').first();
      
      const imageUrl = imgEl.attr('data-src') || imgEl.attr('src');
      
      // Skip if it looks like a navigation banner (optional heuristic)
      if (imageUrl && imageUrl.includes('nav/property_')) return;

      const textContent = el.text();
      
      // Rent extraction
      let rent: number | null = null;
      const rentMatch = textContent.match(/([\d,]+)円/);
      if (rentMatch) {
          rent = parseInt(rentMatch[1].replace(/,/g, ''), 10);
      }

      // Address extraction
      let address = '';
      const addressMatch = textContent.match(/所在地\s+([^\n\r]+)/);
      if (addressMatch) {
          address = addressMatch[1].trim();
      } else {
        const prefMatch = textContent.match(/(東京都|神奈川県|千葉県|埼玉県|茨城県|栃木県|群馬県)[^\s]*/);
        if (prefMatch) address = prefMatch[0];
      }

      let prefecture = 'その他';
      if (address.includes('東京都')) prefecture = '東京都';
      else if (address.includes('神奈川県')) prefecture = '神奈川県';
      else if (address.includes('千葉県')) prefecture = '千葉県';
      else if (address.includes('埼玉県')) prefecture = '埼玉県';
      else if (address.includes('茨城県')) prefecture = '茨城県';
      else if (address.includes('栃木県')) prefecture = '栃木県';

      // Status
      let status: 'available' | 'occupied' | 'unknown' = 'available';
      if (textContent.includes('満室') || textContent.includes('成約') || textContent.includes('終了')) {
          status = 'occupied';
      } else if (!rent) {
           status = 'occupied'; 
      }

      const features: string[] = [];
      if (url.includes('/bike/')) features.push('バイク推奨');
      if (textContent.includes('ガレージ')) features.push('ガレージ');

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
        detailUrl,
        features
      });
    });

    return properties;
  }
}
