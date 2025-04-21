export type Estimate = {
  id?: string;
  name: string;
  address: string;
  details: string;
  amount: string;
  created_at?: string;
};

export type Job = {
  id?: string;
  team_id: string;
  job_name: string;
  date: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  created_at?: string;
};

export type Team = {
  id: string;
  name: string;
  members?: string[];
};

export type Notification = {
  id?: string;
  message: string;
  created_at?: string;
  read?: boolean;
}; 