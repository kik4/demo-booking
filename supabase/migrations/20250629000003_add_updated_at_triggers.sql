-- Add updated_at triggers to existing tables (profiles and bookings)
-- Note: The update_updated_at_column function already exists from services table migration

-- Create trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for bookings table
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();