export interface Property {
  id: string;
  sourceId: string;
  source: string;
  name: string;
  address: string;
  prefecture: string;
  rent: number | null;
  status: string;
  imageUrl: string | null;
  detailUrl: string;
  features: string[];
  firstSeenAt: string;
  lastSeenAt: string;
}
