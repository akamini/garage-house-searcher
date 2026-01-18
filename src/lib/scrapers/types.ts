
export interface ScrapedProperty {
  sourceId: string
  source: string
  name: string
  address: string
  prefecture: string
  rent: number | null // null means occupied or price upon request
  managementFee?: number
  status: 'available' | 'occupied' | 'unknown'
  type: 'garage_house' // Default for now
  imageUrl?: string
  detailUrl: string
  features: string[]
}

export interface Scraper {
  source: string
  scrape(): Promise<ScrapedProperty[]>
}
