-- Sample data for PartsFinda marketplace testing
-- Run this after the main schema

-- Sample vehicle models
INSERT INTO public.models (make_id, name, slug)
SELECT m.id, model_name, LOWER(REPLACE(model_name, ' ', '-'))
FROM public.makes m
CROSS JOIN (
  VALUES
    ('Camry'), ('Corolla'), ('RAV4'), ('Prius'), ('Highlander'),
    ('Civic'), ('Accord'), ('CR-V'), ('Fit'), ('Pilot'),
    ('Altima'), ('Sentra'), ('Maxima'), ('Rogue'), ('Pathfinder'),
    ('CX-5'), ('Mazda3'), ('Mazda6'), ('CX-9'), ('MX-5'),
    ('3 Series'), ('5 Series'), ('X3'), ('X5'), ('Z4'),
    ('C-Class'), ('E-Class'), ('GLC'), ('GLE'), ('S-Class'),
    ('F-150'), ('Mustang'), ('Explorer'), ('Escape'), ('Focus'),
    ('Silverado'), ('Camaro'), ('Equinox'), ('Tahoe'), ('Cruze')
) AS models(model_name)
WHERE (m.name = 'Toyota' AND model_name IN ('Camry', 'Corolla', 'RAV4', 'Prius', 'Highlander'))
   OR (m.name = 'Honda' AND model_name IN ('Civic', 'Accord', 'CR-V', 'Fit', 'Pilot'))
   OR (m.name = 'Nissan' AND model_name IN ('Altima', 'Sentra', 'Maxima', 'Rogue', 'Pathfinder'))
   OR (m.name = 'Mazda' AND model_name IN ('CX-5', 'Mazda3', 'Mazda6', 'CX-9', 'MX-5'))
   OR (m.name = 'BMW' AND model_name IN ('3 Series', '5 Series', 'X3', 'X5', 'Z4'))
   OR (m.name = 'Mercedes-Benz' AND model_name IN ('C-Class', 'E-Class', 'GLC', 'GLE', 'S-Class'))
   OR (m.name = 'Ford' AND model_name IN ('F-150', 'Mustang', 'Explorer', 'Escape', 'Focus'))
   OR (m.name = 'Chevrolet' AND model_name IN ('Silverado', 'Camaro', 'Equinox', 'Tahoe', 'Cruze'));

-- Sample profiles (sellers)
INSERT INTO public.profiles (id, username, full_name, phone, address, parish, is_seller, seller_verified, seller_rating, seller_reviews_count)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'autoparts_king', 'Marcus Campbell', '876-555-0101', '123 Spanish Town Road', 'St. Catherine', true, true, 4.8, 125),
  ('00000000-0000-0000-0000-000000000002', 'jdm_specialist', 'Keisha Williams', '876-555-0102', '45 Hagley Park Road', 'Kingston', true, true, 4.9, 89),
  ('00000000-0000-0000-0000-000000000003', 'parts_depot_ja', 'Andre Brown', '876-555-0103', '78 Main Street', 'Mandeville', true, true, 4.7, 156),
  ('00000000-0000-0000-0000-000000000004', 'euro_parts_expert', 'Sarah Mitchell', '876-555-0104', '92 Constant Spring Road', 'Kingston', true, true, 4.6, 93);

-- Sample parts listings
INSERT INTO public.parts (seller_id, category_id, make_id, model_id, title, description, part_number, condition, price, quantity, year_from, year_to, location, parish, warranty_months, images, status)
SELECT
  profiles.id as seller_id,
  categories.id as category_id,
  makes.id as make_id,
  models.id as model_id,
  parts_data.title,
  parts_data.description,
  parts_data.part_number,
  parts_data.condition::TEXT,
  parts_data.price,
  parts_data.quantity,
  parts_data.year_from,
  parts_data.year_to,
  parts_data.location,
  parts_data.parish,
  parts_data.warranty_months,
  parts_data.images::JSONB,
  'active'
FROM (
  VALUES
    ('autoparts_king', 'Brake System', 'Toyota', 'Camry', 'Toyota Camry Brake Pads Set', 'OEM quality brake pads for Toyota Camry. Front and rear set included. Excellent stopping power and long lasting.', 'BP-TOY-CAM-001', 'new', 8500.00, 5, 2015, 2023, 'Spanish Town', 'St. Catherine', 12, '["https://images.unsplash.com/photo-1486754735734-325b5831c3ad"]'),
    ('jdm_specialist', 'Engine Parts', 'Honda', 'Civic', 'Honda Civic Engine Air Filter', 'High performance air filter for Honda Civic. Improves airflow and engine performance. Japanese import quality.', 'AF-HON-CIV-002', 'new', 3200.00, 10, 2016, 2024, 'New Kingston', 'Kingston', 6, '["https://images.unsplash.com/photo-1558618666-d0c7c2c8d4c6"]'),
    ('parts_depot_ja', 'Electrical', 'Nissan', 'Altima', 'Nissan Altima Headlight Assembly', 'Complete headlight assembly for Nissan Altima. Crystal clear lens with bright LED bulbs. Easy installation.', 'HL-NIS-ALT-003', 'used', 12000.00, 2, 2018, 2022, 'Mandeville', 'Manchester', 3, '["https://images.unsplash.com/photo-1449824913935-59a10b8d2000"]'),
    ('euro_parts_expert', 'Engine Parts', 'BMW', '3 Series', 'BMW 3 Series Oil Filter', 'Genuine BMW oil filter for 3 Series. Ensures optimal engine lubrication and performance. Original equipment quality.', 'OF-BMW-3S-004', 'new', 4500.00, 8, 2019, 2024, 'Constant Spring', 'Kingston', 12, '["https://images.unsplash.com/photo-1486754735734-325b5831c3ad"]'),
    ('autoparts_king', 'Suspension', 'Toyota', 'RAV4', 'Toyota RAV4 Shock Absorbers', 'Heavy duty shock absorbers for Toyota RAV4. Improves ride comfort and handling. Set of 4 pieces.', 'SA-TOY-RAV-005', 'refurbished', 15000.00, 3, 2017, 2023, 'Spanish Town', 'St. Catherine', 6, '["https://images.unsplash.com/photo-1486754735734-325b5831c3ad"]'),
    ('jdm_specialist', 'Body Parts', 'Honda', 'Accord', 'Honda Accord Side Mirror', 'Power adjustable side mirror for Honda Accord. Includes heating element and turn signal. Driver side.', 'SM-HON-ACC-006', 'used', 7800.00, 1, 2015, 2020, 'New Kingston', 'Kingston', 1, '["https://images.unsplash.com/photo-1449824913935-59a10b8d2000"]'),
    ('parts_depot_ja', 'Interior', 'Mazda', 'CX-5', 'Mazda CX-5 Steering Wheel', 'Leather wrapped steering wheel for Mazda CX-5. Includes cruise control buttons and audio controls. Excellent condition.', 'SW-MAZ-CX5-007', 'used', 11500.00, 1, 2016, 2022, 'Mandeville', 'Manchester', 2, '["https://images.unsplash.com/photo-1449824913935-59a10b8d2000"]'),
    ('euro_parts_expert', 'Wheels & Tires', 'Mercedes-Benz', 'C-Class', 'Mercedes C-Class Alloy Wheels', 'Set of 4 original Mercedes alloy wheels. 17 inch diameter. Tires not included. Minor scratches but structurally sound.', 'AW-MER-CC-008', 'used', 25000.00, 1, 2018, 2024, 'Constant Spring', 'Kingston', 0, '["https://images.unsplash.com/photo-1558618666-d0c7c2c8d4c6"]')
) AS parts_data(seller_username, category_name, make_name, model_name, title, description, part_number, condition, price, quantity, year_from, year_to, location, parish, warranty_months, images)
JOIN public.profiles ON profiles.username = parts_data.seller_username
JOIN public.categories ON categories.name = parts_data.category_name
JOIN public.makes ON makes.name = parts_data.make_name
JOIN public.models ON models.name = parts_data.model_name AND models.make_id = makes.id;

-- Update parts view counts randomly
UPDATE public.parts SET views = FLOOR(RANDOM() * 500) + 10;
