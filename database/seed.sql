USE signfix;
INSERT IGNORE INTO roles(name) VALUES ('super_admin'),('admin'),('sales_manager'),('service_manager'),('technician_manager'),('support_agent'),('customer'),('technician');
-- All demo passwords are SignFix@123. Replace these users before production use.
INSERT IGNORE INTO users(role_id,name,email,mobile,password_hash) VALUES
((SELECT id FROM roles WHERE name='super_admin'),'Arun Kumar','admin@signfix.in','9999999999','$2b$12$algQbhUt2jA5RsqmJcZH4uyFY7md0qhX52VncSrJOyIMSq.G4.X3m'),
((SELECT id FROM roles WHERE name='customer'),'Demo Customer','customer@signfix.in','9876543210','$2b$12$algQbhUt2jA5RsqmJcZH4uyFY7md0qhX52VncSrJOyIMSq.G4.X3m'),
((SELECT id FROM roles WHERE name='technician'),'Demo Technician','tech@signfix.in','9812345678','$2b$12$algQbhUt2jA5RsqmJcZH4uyFY7md0qhX52VncSrJOyIMSq.G4.X3m');
INSERT IGNORE INTO customers(user_id,company_name,address) SELECT id,'Demo Retail',JSON_OBJECT('city','Bengaluru','state','Karnataka') FROM users WHERE email='customer@signfix.in';
INSERT IGNORE INTO technicians(user_id,service_areas) SELECT id,JSON_ARRAY('Bengaluru') FROM users WHERE email='tech@signfix.in';
INSERT IGNORE INTO products(id,name,category,description,pricing_method,status) VALUES
(1,'LED Sign Board','Illuminated','Energy-efficient LED signage','sqft',1),(2,'Acrylic Sign Board','Premium','Premium acrylic signage','sqft',1),(3,'Flex Sign Board','Economy','Printed flex signage','sqft',1),(4,'Neon Sign','Decorative','Custom neon concept','sqft',1);
INSERT IGNORE INTO pricing_rules(product_id,rule_type,amount,tax_rate) VALUES (1,'base_sqft',850,18),(2,'base_sqft',650,18),(3,'base_sqft',280,18),(4,'base_sqft',1100,18);
INSERT IGNORE INTO product_categories(name) VALUES ('Illuminated'),('Non-illuminated'),('Letters'),('Outdoor'),('Custom');
INSERT IGNORE INTO materials(name,price_per_sqft) VALUES ('Acrylic',100),('ACP',130),('PVC',80),('Flex',50),('Stainless Steel',250),('Aluminium',180);
INSERT IGNORE INTO lighting_options(name,price_per_sqft) VALUES ('No Lighting',0),('LED',120),('Backlit',160),('Neon',240),('Front Lit',140),('Custom',0);
INSERT IGNORE INTO service_categories(name) VALUES ('LED Problem'),('Electrical Issue'),('Physical Damage'),('Sign Board Repair'),('Replacement'),('Installation'),('Reinstallation'),('Cleaning'),('Maintenance'),('Inspection'),('Emergency'),('Other');
