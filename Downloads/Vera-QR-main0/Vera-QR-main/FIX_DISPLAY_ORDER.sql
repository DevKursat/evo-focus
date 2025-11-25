-- Add display_order column to products table if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update all existing products to have display_order = 0
UPDATE products 
SET display_order = 0 
WHERE display_order IS NULL;
