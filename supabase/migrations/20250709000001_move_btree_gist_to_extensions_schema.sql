-- Move btree_gist extension from public schema to extensions schema
-- This addresses the security issue of having extensions in the public schema

-- First, drop the extension from the public schema
DROP EXTENSION IF EXISTS btree_gist;

-- Create the extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Install the extension in the extensions schema
CREATE EXTENSION IF NOT EXISTS btree_gist SCHEMA extensions;

-- Update the search path to include the extensions schema
-- This ensures the extension functions are available when needed
ALTER DATABASE postgres SET search_path = public, extensions;

-- Note: The existing exclusion constraint on bookings table should continue to work
-- because the tsrange operator and GiST functionality will be available through
-- the updated search path