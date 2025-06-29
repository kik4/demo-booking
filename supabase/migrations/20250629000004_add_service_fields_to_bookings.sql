-- Add service_id and service_info columns to bookings table
ALTER TABLE bookings 
ADD COLUMN service_id INTEGER NOT NULL REFERENCES services(id),
ADD COLUMN service_info JSONB NOT NULL;

-- Create index on service_id for foreign key performance
CREATE INDEX idx_bookings_service_id ON bookings(service_id);

-- Create GIN index on service_info for JSONB queries
CREATE INDEX idx_bookings_service_info ON bookings USING GIN (service_info);

-- Add comment for documentation
COMMENT ON COLUMN bookings.service_id IS 'Foreign key reference to services table';
COMMENT ON COLUMN bookings.service_info IS 'JSONB snapshot of service details at time of booking (name, duration, price, etc.)';