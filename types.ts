

export enum SignalType {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export enum SignalStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  PENDING = 'PENDING'
}

export enum AssetType {
  CRYPTO = 'Crypto',
  FOREX = 'Forex',
  COMMODITY = 'Commodity'
}

export enum RiskLevel {
  CONSERVATIVE = 'Conservative',
  MODERATE = 'Moderate',
  AGGRESSIVE = 'Aggressive'
}

export enum TradeDuration {
  SCALP = 'Scalp (Short-term)',
  INTRADAY = 'Intraday',
  SWING = 'Swing (Multi-day)'
}

export enum Timeframe {
  M15 = '15m',
  H1 = '1H',
  H4 = '4H',
  D1 = 'Daily'
}

export interface UserPreferences {
  riskLevel: RiskLevel;
  tradeDuration: TradeDuration;
  preferredIndicators: string[];
}

export interface ChartPoint {
  time: string;
  price: number;
}

export interface SearchSource {
  title: string;
  uri: string;
}

export type AdStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';

export interface AdData {
  id: string;
  company: string;
  text: string;
  uri?: string;
  color: string;
  status: AdStatus;
  timestamp: string;
}

export interface TradingSignal {
  id: string;
  asset: string; // e.g., BTC/USD, XAU/USD
  assetType: AssetType;
  type: SignalType;
  entryPrice: number;
  currentPrice?: number; // Live updated price
  stopLoss: number;
  takeProfit: number;
  status: SignalStatus;
  openTime: string;
  closeTime?: string;
  realizedPnL?: number; // Percentage
  realizedPnLValue?: number; // Dollar amount per unit (simplified)
  technicalAnalysis: string;
  fundamentalAnalysis: string;
  confidenceScore: number; // 0-100
  chartData: ChartPoint[]; // Simulated chart data for visualization
  searchSources?: SearchSource[]; // Links to live data sources
  pattern?: string; // Identified technical pattern e.g. "Bull Flag"
  support?: number; // Support level identified
  resistance?: number; // Resistance level identified
  timeframe: Timeframe; // Chart timeframe
}

export const ASSETS = [
  { symbol: 'BTC/USD', name: 'Bitcoin', type: AssetType.CRYPTO },
  { symbol: 'ETH/USD', name: 'Ethereum', type: AssetType.CRYPTO },
  { symbol: 'XAU/USD', name: 'Gold', type: AssetType.COMMODITY },
  { symbol: 'XAG/USD', name: 'Silver', type: AssetType.COMMODITY },
  { symbol: 'EUR/USD', name: 'Euro/Dollar', type: AssetType.FOREX },
  { symbol: 'GBP/USD', name: 'Pound/Dollar', type: AssetType.FOREX },
  { symbol: 'USD/JPY', name: 'Dollar/Yen', type: AssetType.FOREX },
];