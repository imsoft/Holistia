-- Add confirmation_code field to event_registrations table
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS confirmation_code TEXT UNIQUE;

-- Create index for confirmation_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_registrations_confirmation_code ON public.event_registrations(confirmation_code);

-- Add constraint to ensure confirmation_code is not empty when provided
ALTER TABLE public.event_registrations 
ADD CONSTRAINT event_registrations_confirmation_code_not_empty 
CHECK (confirmation_code IS NULL OR LENGTH(TRIM(confirmation_code)) > 0);

-- Create function to generate unique confirmation code
CREATE OR REPLACE FUNCTION generate_event_confirmation_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        -- Generate a 8-character alphanumeric code
        code := UPPER(
            SUBSTRING(
                MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 
                1, 8
            )
        );
        
        -- Check if code already exists
        SELECT COUNT(*) INTO exists_count 
        FROM public.event_registrations 
        WHERE confirmation_code = code;
        
        -- If code doesn't exist, return it
        IF exists_count = 0 THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate confirmation code when status changes to 'confirmed'
CREATE OR REPLACE FUNCTION set_event_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate code when status changes to 'confirmed' and no code exists
    IF NEW.status = 'confirmed' AND (OLD.status != 'confirmed' OR OLD.status IS NULL) AND NEW.confirmation_code IS NULL THEN
        NEW.confirmation_code := generate_event_confirmation_code();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_event_confirmation_code ON public.event_registrations;
CREATE TRIGGER trigger_set_event_confirmation_code
    BEFORE UPDATE ON public.event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION set_event_confirmation_code();
