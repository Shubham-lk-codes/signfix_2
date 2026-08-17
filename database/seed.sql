INSERT INTO roles(name) VALUES ('super_admin'),('admin'),('sales_manager'),('service_manager'),('technician_manager'),('support_agent'),('customer'),('technician') ON CONFLICT (name) DO NOTHING;
INSERT INTO permissions(name,description) SELECT name,description FROM (VALUES
('customer.view','View customers'),('customer.create','Create customers'),('customer.update','Update customers'),('customer.disable','Disable customers'),
('product.view','View catalog'),('product.create','Create catalog records'),('product.update','Update catalog records'),('product.delete','Disable catalog records'),
('pricing.view','View pricing'),('pricing.create','Create pricing rules'),('pricing.update','Update pricing rules'),
('order.view','View orders'),('order.update','Update orders'),('order.approve','Approve orders'),('order.cancel','Cancel orders'),
('quotation.view','View quotations'),('quotation.create','Create quotations'),('quotation.update','Update quotations'),('quotation.send','Send quotations'),('quotation.approve','Approve quotations'),
('service.view','View services'),('service.create','Create services'),('service.update','Update services'),('service.assign','Assign services'),('service.close','Close services'),
('technician.view','View technicians'),('technician.create','Create technicians'),('technician.update','Update technicians'),('technician.assign','Assign technicians'),
('asset.view','View assets'),('asset.create','Create assets'),('asset.update','Update assets'),('reports.view','View reports'),('reports.export','Export reports'),
('ai.view','View AI records'),('ai.create','Create AI records'),('ai.update','Update AI records'),('ai.delete','Disable AI records'),
('notifications.view','View notifications'),('settings.view','View settings'),('settings.create','Create settings'),('settings.update','Update settings'),('settings.delete','Delete settings'),
('audit.view','View audit logs')) p(name,description) ON CONFLICT(name) DO UPDATE SET description=EXCLUDED.description;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.name='admin' ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON
 (r.name='sales_manager' AND (p.name LIKE 'customer.%' OR p.name LIKE 'product.%' OR p.name LIKE 'pricing.%' OR p.name LIKE 'order.%' OR p.name LIKE 'quotation.%' OR p.name LIKE 'ai.%' OR p.name='reports.view')) OR
 (r.name='service_manager' AND (p.name LIKE 'customer.view' OR p.name LIKE 'service.%' OR p.name LIKE 'technician.view' OR p.name LIKE 'asset.%' OR p.name='reports.view')) OR
 (r.name='technician_manager' AND (p.name LIKE 'technician.%' OR p.name LIKE 'service.%' OR p.name LIKE 'asset.view' OR p.name='reports.view')) OR
 (r.name='support_agent' AND p.name IN ('customer.view','order.view','quotation.view','service.view','asset.view','ai.view','notifications.view'))
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON
 (r.name='customer' AND p.name IN ('product.view','pricing.view','order.view','quotation.view','service.view','asset.view','notifications.view')) OR
 (r.name='technician' AND p.name IN ('service.view','asset.view','notifications.view'))
ON CONFLICT DO NOTHING;
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
