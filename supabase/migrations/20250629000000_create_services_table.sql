-- Create services table with all required columns
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  duration INTEGER NOT NULL, -- duration in minutes
  price INTEGER NOT NULL, -- price in JPY
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP DEFAULT NULL
);

-- Create index for deleted_at column for performance
CREATE INDEX idx_services_deleted_at ON services (deleted_at);

-- Create trigger function to automatically update updated_at when row is modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create trigger for services table
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active services (deleted_at IS NULL)
CREATE POLICY "services_select_policy" ON services
  FOR SELECT
  USING (deleted_at IS NULL);

-- Only admins can INSERT, UPDATE, DELETE services
CREATE POLICY "services_admin_insert_policy" ON services
  FOR INSERT
  WITH CHECK (is_admin_user());

CREATE POLICY "services_admin_update_policy" ON services
  FOR UPDATE
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "services_admin_delete_policy" ON services
  FOR DELETE
  USING (is_admin_user());