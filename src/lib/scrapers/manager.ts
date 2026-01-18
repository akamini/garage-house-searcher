
import { PrismaClient } from '@prisma/client';
import { TokyoGarageScraper } from './tokyo-garage';
import { GarageHouseBizScraper } from './garagehouse-biz';
import { JapanGaragingClubScraper } from './garage110';
import { GarrozzeScraper } from './garrozze';
import { ScrapedProperty } from './types';

const prisma = new PrismaClient();

export class ScraperManager {
  private scrapers = [
    new TokyoGarageScraper(),
    new GarageHouseBizScraper(),
    // new JapanGaragingClubScraper(), // TODO: Investigate SPA/structure issues
    new GarrozzeScraper()
  ];

  async session() {
      // Logic to run all scrapers
      for (const scraper of this.scrapers) {
          console.log(`Starting scrape for ${scraper.source}...`);
          const startTime = Date.now();
          try {
              const properties = await scraper.scrape();
              console.log(`Scraped ${properties.length} properties from ${scraper.source}`);
              
              await this.save(properties);

              await prisma.scrapeLog.create({
                  data: {
                      source: scraper.source,
                      status: 'success',
                      count: properties.length
                  }
              });
          } catch (error) {
              console.error(`Error scraping ${scraper.source}:`, error);
              await prisma.scrapeLog.create({
                  data: {
                      source: scraper.source,
                      status: 'error',
                      count: 0
                  }
              });
          }
      }
  }

  private async save(properties: ScrapedProperty[]) {
      for (const prop of properties) {
          // Upsert property
          // We use source + sourceId as unique key
          await prisma.property.upsert({
              where: {
                  source_sourceId: {
                      source: prop.source,
                      sourceId: prop.sourceId
                  }
              },
              update: {
                  // Update fields that might change
                  name: prop.name,
                  rent: prop.rent,
                  status: prop.status,
                  lastSeenAt: new Date(),
                  imageUrl: prop.imageUrl
                  // We don't update address/features usually unless specific logic
              },
              create: {
                  sourceId: prop.sourceId,
                  source: prop.source,
                  name: prop.name,
                  address: prop.address,
                  prefecture: prop.prefecture,
                  rent: prop.rent,
                  status: prop.status,
                  type: prop.type,
                  imageUrl: prop.imageUrl,
                  detailUrl: prop.detailUrl,
                  features: prop.features
              }
          });

          // History tracking (optional, specifically for rent changes or status changes)
          // Simplified: just save current state to history if status/rent changes?
          // For now, let's keep it simple and maybe implement history logic later if requested details
      }
  }
}
