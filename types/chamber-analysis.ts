export interface ChamberDetail {
  id: string;
  name: string;
  code: string;
  type: string;
  totalCapacity: number;
  currentHolding: number;
  available: number;
  occupancyRate: number;
  floorWise: Record<string, number>;
}

export interface ChamberAnalysisResponse {
  summary: {
    totalCap: number;
    totalHold: number;
    totalAvailable: number;
  };
  chambers: ChamberDetail[];
}
