export interface LaunchPerformanceTiers {
  bonded: number;
  top10: number;
  top1: number;
  best24h: number;
  sample_size: number;
  all_median?: number;
  all_count?: number;
  best_address?: string;
  best_pair?: string;
  time_to_peak?: {
    bonded: number | null;
    top10: number | null;
    top1: number | null;
    best24h: number | null;
  };
}

export interface LaunchMetricData {
  name: string;
  current: number | null;
  trend: "up" | "down" | "flat";
  last_updated: string;
  chart: { date: string; value: number | null }[];
  breakdown?: Record<string, number | null>;
  tiers?: LaunchPerformanceTiers;
  migration_rate?: number;
  total_graduated?: number;
  total_launches?: number;
}

export interface LaunchOverviewData {
  metrics: LaunchMetricData[];
  last_updated: string;
}
