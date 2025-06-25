-- Add name_hiragana, sex, and date_of_birth fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN name_hiragana text NOT NULL,
ADD COLUMN sex smallint NOT NULL CHECK (sex IN (0, 1, 2, 9)),
ADD COLUMN date_of_birth date NOT NULL;

-- Add comment to explain sex field values (ISO 5218)
COMMENT ON COLUMN public.profiles.sex IS 'ISO 5218 sex codes: 0=not known, 1=male, 2=female, 9=not applicable';