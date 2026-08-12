INSERT INTO roles(name) VALUES ('super_admin'),('admin'),('sales_manager'),('service_manager'),('technician_manager'),('support_agent'),('customer'),('technician') ON CONFLICT (name) DO NOTHING;
-- All demo passwords are `SignFix@123` (the period after this sentence is not part of the password).
-- bcrypt hash for the documented development password: SignFix@123.
-- The conflict update also repairs demo users created by an older broken seed.
INSERT INTO users(role_id,name,email,mobile,password_hash)
SELECT r.id,v.name,v.email,v.mobile,'$2b$10$N7YMUi7f4qo0wnpExQagQuR7tpjUD3rcOabitmozbImGYkOhlSYW6'
FROM (VALUES ('super_admin','Arun Kumar','admin@signfix.in','9999999999'),('customer','Demo Customer','customer@signfix.in','9876543210'),('technician','Demo Technician','tech@signfix.in','9812345678')) AS v(role,name,email,mobile)
JOIN roles r ON r.name=v.role
ON CONFLICT (email) DO UPDATE SET role_id=EXCLUDED.role_id,name=EXCLUDED.name,mobile=EXCLUDED.mobile,password_hash=EXCLUDED.password_hash,status='active';
INSERT INTO customers(user_id,company_name,address) SELECT id,'Demo Retail','{"city":"Bengaluru","state":"Karnataka"}'::jsonb FROM users WHERE email='customer@signfix.in' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO technicians(user_id,service_areas) SELECT id,'["Bengaluru"]'::jsonb FROM users WHERE email='tech@signfix.in' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO products(id,name,category,description,pricing_method,status) VALUES (1,'LED Sign Board','Illuminated','Energy-efficient LED signage','sqft',TRUE),(2,'Acrylic Sign Board','Premium','Premium acrylic signage','sqft',TRUE),(3,'Flex Sign Board','Economy','Printed flex signage','sqft',TRUE),(4,'Neon Sign','Decorative','Custom neon concept','sqft',TRUE) ON CONFLICT (id) DO NOTHING;
INSERT INTO products(name,category,description,pricing_method,status)
SELECT v.* FROM (VALUES
('Glow Sign Board','Illuminated','Illuminated glow signage','sqft',TRUE),
('3D Letter','Letters','Dimensional letter signage','sqft',TRUE),
('Channel Letter','Letters','Fabricated channel letters','sqft',TRUE),
('Backlit Sign','Illuminated','Backlit signage','sqft',TRUE),
('Outdoor Signage','Outdoor','Weather-resistant outdoor signage','sqft',TRUE),
('Custom Sign Board','Custom','Custom sign board requirement','sqft',TRUE),
('Other','Custom','Other signage requirement','sqft',TRUE)) v(name,category,description,pricing_method,status)
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.name=v.name);
INSERT INTO pricing_rules(product_id,rule_type,amount,tax_rate) SELECT * FROM (VALUES (1::bigint,'base_sqft',850::numeric,18::numeric),(2,'base_sqft',650,18),(3,'base_sqft',280,18),(4,'base_sqft',1100,18)) v WHERE NOT EXISTS (SELECT 1 FROM pricing_rules p WHERE p.product_id=v.column1 AND p.rule_type=v.column2);
INSERT INTO product_categories(name) VALUES ('Illuminated'),('Non-illuminated'),('Letters'),('Outdoor'),('Custom') ON CONFLICT (name) DO NOTHING;
INSERT INTO materials(name,price_per_sqft) VALUES ('Acrylic',100),('ACP',130),('PVC',80),('Flex',50),('Stainless Steel',250),('Aluminium',180) ON CONFLICT (name) DO NOTHING;
INSERT INTO lighting_options(name,price_per_sqft) VALUES ('No Lighting',0),('LED',120),('Backlit',160),('Neon',240),('Front Lit',140),('Custom',0) ON CONFLICT (name) DO NOTHING;
INSERT INTO service_categories(name) VALUES ('LED Problem'),('Electrical Issue'),('Physical Damage'),('Sign Board Repair'),('Replacement'),('Installation'),('Reinstallation'),('Cleaning'),('Maintenance'),('Inspection'),('Emergency'),('Other') ON CONFLICT (name) DO NOTHING;
