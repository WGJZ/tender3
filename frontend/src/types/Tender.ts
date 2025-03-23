export interface Tender {
  id: number;
  title: string;
  description: string;
  budget: string;
  category: string;
  status: string;
  requirements: string;
  notice_date: string;
  submission_deadline: string;
  winner_date?: string;
  construction_start?: string;
  construction_end?: string;
  created_by: number;
  created_at: string;
} 