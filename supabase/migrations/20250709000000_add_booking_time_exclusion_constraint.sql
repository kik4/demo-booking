-- Add exclusion constraint to prevent overlapping bookings
-- This constraint ensures that no two active bookings (deleted_at IS NULL) can have overlapping time ranges

BEGIN;

-- Enable btree_gist extension for range operations
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint to prevent overlapping bookings
-- Only applies to bookings that are not logically deleted (deleted_at IS NULL)
ALTER TABLE bookings 
ADD CONSTRAINT no_overlapping_active_bookings 
EXCLUDE USING gist (
  tsrange(start_time, end_time) WITH &&
) WHERE (deleted_at IS NULL);

COMMIT;