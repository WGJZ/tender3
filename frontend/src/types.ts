export interface Bid {
  id: number;
  tender: number;
  company: number;
  company_name?: string;
  bidding_price: number;
  documents: string;
  submission_date: string;
  is_winner: boolean;
  awarded_at?: string | null;
  additional_notes?: string;
  status?: 'ACCEPTED' | 'REJECTED' | 'PENDING';
} 