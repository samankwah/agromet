-- TriAgro AI Reference Data Seeding
-- Populates regions, districts, commodities, and production stages

-- Insert production stages for different categories
INSERT INTO production_stages (name, description, sequence_order, category) VALUES
-- Crop production stages
('Site Selection', 'Selection of suitable farming site based on soil and climate conditions', 1, 'crop'),
('Land Preparation', 'Clearing, plowing, and preparing land for planting', 2, 'crop'),
('Seed Selection', 'Selection and treatment of quality seeds', 3, 'crop'),
('Planting/Sowing', 'Planting seeds or seedlings in prepared land', 4, 'crop'),
('Germination', 'Monitoring seed germination and emergence', 5, 'crop'),
('Nursery Management', 'Managing seedlings in nursery before transplanting', 6, 'crop'),
('Transplanting', 'Moving seedlings from nursery to main field', 7, 'crop'),
('1st Fertilizer Application', 'First application of fertilizers to promote growth', 8, 'crop'),
('Weeding', 'Removal of weeds to reduce competition', 9, 'crop'),
('Pest and Disease Control', 'Management of pests and diseases', 10, 'crop'),
('2nd Fertilizer Application', 'Second fertilizer application during growth stage', 11, 'crop'),
('3rd Fertilizer Application', 'Third fertilizer application before maturity', 12, 'crop'),
('2nd Weed Control', 'Second weeding operation', 13, 'crop'),
('Rogueing', 'Removal of off-type plants to maintain variety purity', 14, 'crop'),
('Bird Scaring and Netting', 'Protection of crops from bird damage', 15, 'crop'),
('Harvesting', 'Harvesting of mature crops', 16, 'crop'),
('Post-Harvest Handling', 'Processing, drying, and storage of harvested crops', 17, 'crop'),

-- Poultry production stages
('Brooding', 'Care of day-old chicks in controlled environment', 1, 'poultry'),
('Feeding Management', 'Proper feeding schedule and nutrition management', 2, 'poultry'),
('Health Management', 'Vaccination and disease prevention programs', 3, 'poultry'),
('Growth Monitoring', 'Regular monitoring of bird growth and performance', 4, 'poultry'),
('Marketing', 'Sale of mature birds or eggs', 5, 'poultry');

-- Insert major regions of Ghana with codes
INSERT INTO regions (code, name, zone) VALUES
('REG01', 'Greater Accra Region', 'Coastal Plains'),
('REG02', 'Ashanti Region', 'Forest Zone'),
('REG03', 'Western Region', 'Forest Zone'),
('REG04', 'Central Region', 'Coastal Plains'),
('REG05', 'Eastern Region', 'Forest Zone'),
('REG06', 'Western North Region', 'Forest Zone'),
('REG07', 'Volta Region', 'Forest Zone'),
('REG08', 'Northern Region', 'Guinea Savannah'),
('REG09', 'Upper East Region', 'Sudan Savannah'),
('REG10', 'Oti Region', 'Transition Zone'),
('REG11', 'Upper West Region', 'Sudan Savannah'),
('REG12', 'Brong Ahafo Region', 'Forest-Savannah Transition'),
('REG13', 'Ahafo Region', 'Forest Zone'),
('REG14', 'Bono Region', 'Forest-Savannah Transition'),
('REG15', 'Bono East Region', 'Forest-Savannah Transition'),
('REG16', 'Savannah Region', 'Guinea Savannah');

-- Insert sample districts (focusing on key districts from the Excel files)
INSERT INTO districts (code, name, capital, region_id) VALUES
-- Greater Accra Region districts
('DS001', 'Accra Metropolitan', 'Accra', (SELECT id FROM regions WHERE code = 'REG01')),
('DS002', 'Tema Metropolitan', 'Tema', (SELECT id FROM regions WHERE code = 'REG01')),
('DS148', 'La-Dade-Kotopon', 'La', (SELECT id FROM regions WHERE code = 'REG01')),

-- Ashanti Region districts
('DS010', 'Kumasi Metropolitan', 'Kumasi', (SELECT id FROM regions WHERE code = 'REG02')),
('DS011', 'Obuasi Municipal', 'Obuasi', (SELECT id FROM regions WHERE code = 'REG02')),

-- Western Region districts
('DS020', 'Sekondi-Takoradi Metropolitan', 'Takoradi', (SELECT id FROM regions WHERE code = 'REG03')),
('DS021', 'Ahanta West Municipal', 'Agona', (SELECT id FROM regions WHERE code = 'REG03')),
('DS022', 'Shama District', 'Shama', (SELECT id FROM regions WHERE code = 'REG03')),

-- Central Region districts
('DS030', 'Cape Coast Metropolitan', 'Cape Coast', (SELECT id FROM regions WHERE code = 'REG04')),
('DS031', 'Komenda-Edina-Eguafo-Abirem Municipal', 'Elmina', (SELECT id FROM regions WHERE code = 'REG04')),

-- Eastern Region districts
('DS040', 'Koforidua Municipal', 'Koforidua', (SELECT id FROM regions WHERE code = 'REG05')),

-- Oti Region districts (from sample files)
('DS179', 'Biakoye', 'Kpassa', (SELECT id FROM regions WHERE code = 'REG10')),
('DS180', 'Nkwanta South Municipal', 'Nkwanta', (SELECT id FROM regions WHERE code = 'REG10')),

-- Northern Region districts
('DS080', 'Tamale Metropolitan', 'Tamale', (SELECT id FROM regions WHERE code = 'REG08')),

-- Upper East Region districts
('DS090', 'Bolgatanga Municipal', 'Bolgatanga', (SELECT id FROM regions WHERE code = 'REG09')),

-- Upper West Region districts
('DS110', 'Wa Municipal', 'Wa', (SELECT id FROM regions WHERE code = 'REG11'));

-- Insert major commodities with codes
INSERT INTO commodities (code, name, category) VALUES
-- Cereals
('CT0000000001', 'maize', 'cereal'),
('CT0000000002', 'rice', 'cereal'),
('CT0000000003', 'millet', 'cereal'),
('CT0000000004', 'sorghum', 'cereal'),

-- Vegetables
('CT0000000006', 'tomato', 'vegetable'),
('CT0000000007', 'pepper', 'vegetable'),
('CT0000000009', 'onion', 'vegetable'),
('CT0000000010', 'okra', 'vegetable'),
('CT0000000011', 'cabbage', 'vegetable'),

-- Root and tuber crops
('CT0000000008', 'cassava', 'root_tuber'),
('CT0000000012', 'yam', 'root_tuber'),
('CT0000000013', 'sweet_potato', 'root_tuber'),
('CT0000000014', 'cocoyam', 'root_tuber'),

-- Tree crops
('CT0000000015', 'cocoa', 'tree_crop'),
('CT0000000016', 'coffee', 'tree_crop'),
('CT0000000017', 'oil_palm', 'tree_crop'),
('CT0000000018', 'coconut', 'tree_crop'),
('CT0000000019', 'plantain', 'tree_crop'),

-- Legumes
('CT0000000020', 'beans', 'legume'),
('CT0000000021', 'groundnut', 'legume'),
('CT0000000022', 'soybean', 'legume'),
('CT0000000023', 'cowpea', 'legume'),

-- Livestock/Poultry
('CT0000000005', 'broiler_chicken', 'poultry'),
('CT0000000024', 'layer_chicken', 'poultry'),
('CT0000000025', 'goat', 'livestock'),
('CT0000000026', 'sheep', 'livestock'),
('CT0000000027', 'cattle', 'livestock'),
('CT0000000028', 'pig', 'livestock'),

-- Fruits
('CT0000000029', 'mango', 'fruit'),
('CT0000000030', 'orange', 'fruit'),
('CT0000000031', 'pineapple', 'fruit'),
('CT0000000032', 'banana', 'fruit');

-- Create function to get region ID by code
CREATE OR REPLACE FUNCTION get_region_id_by_code(region_code VARCHAR)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT id FROM regions WHERE code = region_code LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- Create function to get district ID by code
CREATE OR REPLACE FUNCTION get_district_id_by_code(district_code VARCHAR)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT id FROM districts WHERE code = district_code LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- Create function to get commodity ID by code
CREATE OR REPLACE FUNCTION get_commodity_id_by_code(commodity_code VARCHAR)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT id FROM commodities WHERE code = commodity_code LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- Create function to get production stage ID by name
CREATE OR REPLACE FUNCTION get_production_stage_id_by_name(stage_name VARCHAR)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT id FROM production_stages WHERE name ILIKE '%' || stage_name || '%' LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- Insert additional districts that might be referenced in Western Region files
INSERT INTO districts (code, name, capital, region_id) VALUES
('DS023', 'Ellembelle District', 'Nkroful', (SELECT id FROM regions WHERE code = 'REG03')),
('DS024', 'Jomoro Municipal', 'Half Assini', (SELECT id FROM regions WHERE code = 'REG03')),
('DS025', 'Wassa East District', 'Daboase', (SELECT id FROM regions WHERE code = 'REG03')),
('DS026', 'Wassa Amenfi West Municipal', 'Asankragwa', (SELECT id FROM regions WHERE code = 'REG03')),
('DS027', 'Wassa Amenfi Central Municipal', 'Wassa Akropong', (SELECT id FROM regions WHERE code = 'REG03')),
('DS028', 'Prestea Huni-Valley Municipal', 'Prestea', (SELECT id FROM regions WHERE code = 'REG03')),
('DS029', 'Tarkwa-Nsuaem Municipal', 'Tarkwa', (SELECT id FROM regions WHERE code = 'REG03'));

-- Display summary of inserted data
SELECT 
    'Reference data inserted successfully!' as message,
    (SELECT COUNT(*) FROM regions) as regions_count,
    (SELECT COUNT(*) FROM districts) as districts_count,
    (SELECT COUNT(*) FROM commodities) as commodities_count,
    (SELECT COUNT(*) FROM production_stages) as production_stages_count;