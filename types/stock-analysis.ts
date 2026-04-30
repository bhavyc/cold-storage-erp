export interface MonthlyData {
  month: string;
  arrivals: number;
  dispatches: number;
}

export interface LeaderboardItem {
  name: string;
  qty: number;
}

export interface CategoryData {
  name: string;
  value: number;
}

export interface StockAnalysisResponse {
  monthlyStats: MonthlyData[];
  itemLeaderboard: LeaderboardItem[];
  categoryData: CategoryData[];
}
