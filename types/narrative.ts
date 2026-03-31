export interface NarrativeData {
  name: string;
  token_count: number;
  total_volume: number;
  total_mcap: number;
  avg_mcap: number;
  avg_gain_pct: number;
  lifecycle: "emerging" | "trending" | "saturated" | "fading";
  top_token_address: string | null;
  last_updated: string | null;
}

export interface NarrativeTokenData {
  address: string;
  name: string;
  symbol: string;
  narrative: string | null;
  mcap: number | null;
  price_change_pct: number | null;
  created_at: string | null;
}

export interface NarrativeOverview {
  narratives: NarrativeData[];
  top_runners: NarrativeTokenData[];
}
