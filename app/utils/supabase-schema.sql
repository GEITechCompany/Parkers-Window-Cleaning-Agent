-- Schema for window cleaning scheduling system

-- Enable Row Level Security
ALTER DATABASE postgres SET timezone TO 'UTC';

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  members JSONB, -- Array of user IDs or names
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Estimates Table
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  details TEXT,
  amount TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on estimates
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  job_name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, in-progress, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimate_id UUID REFERENCES estimates(id)
);

-- Enable RLS on jobs
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) -- If using Supabase Auth
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Email_Parsing_Results Table
CREATE TABLE IF NOT EXISTS email_parsing_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  from_address TEXT NOT NULL,
  parsed_data JSONB, -- Store structured data extracted from email
  confidence REAL, -- Confidence level of parsing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- Enable RLS on email_parsing_results
ALTER TABLE email_parsing_results ENABLE ROW LEVEL SECURITY;

-- Override_Actions Table
CREATE TABLE IF NOT EXISTS override_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  entity_type TEXT NOT NULL, -- jobs, estimates, etc.
  entity_id UUID NOT NULL
);

-- Enable RLS on override_actions
ALTER TABLE override_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (to be configured based on authentication setup)
-- Example policy for teams:
CREATE POLICY "Team members can view their teams" ON teams
  FOR SELECT USING (
    auth.uid() IN (SELECT jsonb_array_elements_text(members)::uuid FROM teams WHERE id = teams.id)
  );

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS jobs_team_id_idx ON jobs(team_id);
CREATE INDEX IF NOT EXISTS jobs_date_idx ON jobs(date);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS override_actions_entity_id_idx ON override_actions(entity_id);

-- Functions for updated_at trigger
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_teams_modtime
BEFORE UPDATE ON teams
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_estimates_modtime
BEFORE UPDATE ON estimates
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_jobs_modtime
BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION update_modified_column(); 