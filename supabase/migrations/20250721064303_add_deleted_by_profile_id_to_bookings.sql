-- Add deleted_by_profile_id column to bookings table
-- This column will store the profile ID of the user who deleted the booking

ALTER TABLE bookings 
ADD COLUMN deleted_by_profile_id BIGINT REFERENCES profiles(id);

-- Add comment for documentation
COMMENT ON COLUMN bookings.deleted_by_profile_id IS 'Profile ID of the user who deleted this booking (for audit tracking)';