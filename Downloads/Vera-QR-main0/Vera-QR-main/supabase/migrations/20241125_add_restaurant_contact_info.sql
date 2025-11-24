-- Add phone and email to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS email VARCHAR(255);
