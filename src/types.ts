
export enum UserRole {
  TECH = 'Forensic Technician',
  AUDITOR = 'Asset Auditor',
  OPERATOR = 'Standard Operator',
  FLIPPER = 'Asset Flipper',
  DIY = 'Experimental User'
}

export enum DeviceCategory {
  LAPTOP = 'Laptop',
  PHONE = 'Smartphone',
  CONSOLE = 'Game Console',
  TABLET = 'Tablet',
  APPLIANCE = 'Appliance',
  DESKTOP = 'Desktop Computer',
  OTHER = 'Other Electronic'
}

export enum RiskLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High',
  EXTREME = 'Extreme'
}

export interface RepairHub {
  name: string;
  address: string;
  uri: string;
  rating: string;
  specialty: string;
}

export interface DIYGuide {
  title: string;
  uri: string;
  platform: 'youtube' | 'ifixit' | 'article' | 'other';
  author?: string;
  duration?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface RepairTool {
  name: string;
  reason: string;
  link?: string;
}

export interface MarketOption {
  name: string;
  price: string;
  uri: string;
  is_new: boolean;
}

export interface PartsRetailer {
  name: string;
  part_name: string;
  uri: string;
}

export interface DiagnosisResult {
  brand: string;
  model: string;
  confidence_score: number;
  risk_level: RiskLevel;
  is_high_voltage: boolean;
  recommended_action: string;
  reasoning: string;
  potential_fix_cost_estimate: string;
  currency_code: string;
  resale_value: {
    unit_value_fixed: string;
    unit_value_broken: string;
    profit_potential: string;
  };
  recommended_repair_hubs: RepairHub[];
  diy_guides?: DIYGuide[];
  required_tools?: RepairTool[];
  purchase_options: MarketOption[];
  parts_retailers: PartsRetailer[];
  /** Grounding evidence URLs from Google Search */
  sources?: string[];
  /** Safety check for user-selected vs actual device category */
  category_mismatch?: boolean;
  /** The actual category identified by the forensic sweep */
  identified_category?: string;
  /** Flag when device appears pristine with no user-described issues */
  no_visible_issue?: boolean;
  /** Supplemental technical specifications from the local master dataset */
  technical_specs?: Record<string, string | number | null>;
  /** Database-driven common failures for this specific model */
  common_failures?: string[];
  /** Flag for premium content */
  is_pro_report?: boolean;
}

export interface QueryRecord {
  id: string;
  created_at: string;
  category: DeviceCategory;
  description: string;
  photo_urls: string[];
  ai_response: DiagnosisResult;
}

export interface UserProfile {
  id: string;
  role: UserRole | null;
  email: string;
  is_premium: boolean;
  query_count: number;
  onboarding_accepted: boolean;
  permissions: {
    camera: 'prompt' | 'granted' | 'denied';
    location: 'prompt' | 'granted' | 'denied';
  };
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  sources?: string[];
}

export type ThemeMode = 'light' | 'dark';
