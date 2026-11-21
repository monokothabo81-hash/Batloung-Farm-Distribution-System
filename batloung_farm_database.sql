CREATE DATABASE IF NOT EXISTS batloung_farm
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE batloung_farm;

DROP TABLE IF EXISTS sales_details;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS purchase_details;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS stock;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS fruits;
DROP TABLE IF EXISTS suppliers;

CREATE TABLE suppliers (
  supplier_id INT AUTO_INCREMENT PRIMARY KEY,
  business_name VARCHAR(120) NOT NULL,
  contact_person VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL UNIQUE,
  province ENUM('Gauteng','Free State','KwaZulu-Natal','Western Cape',
                'Eastern Cape','Limpopo','Mpumalanga','North West') NOT NULL,
  address VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE fruits (
  fruit_id INT AUTO_INCREMENT PRIMARY KEY,
  fruit_name ENUM('Apples','Bananas','Oranges','Mangoes','Grapes') NOT NULL UNIQUE,
  description VARCHAR(255),
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB;

CREATE TABLE vendors (
  vendor_id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_name VARCHAR(120) NOT NULL,
  phone_number VARCHAR(30) NOT NULL UNIQUE,
  location VARCHAR(150) NOT NULL,
  registration_date DATE NOT NULL DEFAULT (CURRENT_DATE)
) ENGINE=InnoDB;

CREATE TABLE purchases (
  purchase_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  purchase_date DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  CONSTRAINT chk_purchase_total CHECK (total_amount >= 0),
  CONSTRAINT fk_purchases_supplier FOREIGN KEY (supplier_id)
    REFERENCES suppliers(supplier_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE purchase_details (
  purchase_detail_id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  fruit_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  packaging_size ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
  CONSTRAINT chk_purchase_quantity CHECK (quantity > 0),
  CONSTRAINT chk_purchase_unit_cost CHECK (unit_cost >= 0),
  CONSTRAINT fk_purchase_details_purchase FOREIGN KEY (purchase_id)
    REFERENCES purchases(purchase_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_purchase_details_fruit FOREIGN KEY (fruit_id)
    REFERENCES fruits(fruit_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE sales (
  sale_id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  sale_date DATE NOT NULL,
  payment_status ENUM('PAID','PARTIALLY_PAID','UNPAID') NOT NULL DEFAULT 'UNPAID',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_method ENUM('CASH','MOBILE_MONEY','CREDIT') NOT NULL DEFAULT 'CREDIT',
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  CONSTRAINT chk_sale_total CHECK (total_amount >= 0),
  CONSTRAINT chk_amount_paid CHECK (amount_paid >= 0 AND amount_paid <= total_amount),
  CONSTRAINT chk_payment_status CHECK (
    (payment_status = 'UNPAID' AND amount_paid = 0) OR
    (payment_status = 'PARTIALLY_PAID' AND amount_paid > 0 AND amount_paid < total_amount) OR
    (payment_status = 'PAID' AND amount_paid = total_amount)
  ),
  CONSTRAINT fk_sales_vendor FOREIGN KEY (vendor_id)
    REFERENCES vendors(vendor_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE sales_details (
  sales_detail_id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  fruit_id INT NOT NULL,
  packaging_size ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  CONSTRAINT chk_sales_quantity CHECK (quantity > 0),
  CONSTRAINT chk_sales_unit_price CHECK (unit_price >= 0),
  CONSTRAINT fk_sales_details_sale FOREIGN KEY (sale_id)
    REFERENCES sales(sale_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sales_details_fruit FOREIGN KEY (fruit_id)
    REFERENCES fruits(fruit_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE stock (
  stock_id INT AUTO_INCREMENT PRIMARY KEY,
  fruit_id INT NOT NULL,
  packaging_size ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
  available_quantity INT NOT NULL DEFAULT 0,
  CONSTRAINT chk_stock_quantity CHECK (available_quantity >= 0),
  CONSTRAINT uq_stock_fruit_package UNIQUE (fruit_id, packaging_size),
  CONSTRAINT fk_stock_fruit FOREIGN KEY (fruit_id)
    REFERENCES fruits(fruit_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO suppliers (business_name, contact_person, phone, province, address) VALUES
('Highveld Fresh Produce','Thabo Mokoena','+27110000001','Gauteng','Johannesburg, South Africa'),
('Free State Fruit Co.','Naledi Dlamini','+27510000002','Free State','Bloemfontein, South Africa'),
('Cape Harvest Suppliers','Lerato Jacobs','+27210000003','Western Cape','Cape Town, South Africa'),
('KZN Orchard Traders','Sibusiso Khumalo','+27310000004','KwaZulu-Natal','Durban, South Africa');

INSERT INTO fruits (fruit_name, description, status) VALUES
('Apples','Fresh red and green apples','ACTIVE'),
('Bananas','Fresh bananas','ACTIVE'),
('Oranges','Fresh oranges','ACTIVE'),
('Mangoes','Fresh seasonal mangoes','ACTIVE'),
('Grapes','Fresh table grapes','ACTIVE');

INSERT INTO vendors (vendor_name, phone_number, location, registration_date) VALUES
('Maseru Street Vendors','+26658000001','Maseru','2026-01-10'),
('Leribe Fresh Market','+26658000002','Leribe','2026-02-15'),
('Mafeteng Mini Retailers','+26658000003','Mafeteng','2026-03-05');

INSERT INTO purchases (supplier_id, purchase_date, total_amount) VALUES
(1,'2026-10-01',3000.00),
(2,'2026-10-03',1500.00);

INSERT INTO purchase_details (purchase_id, fruit_id, quantity, unit_cost, packaging_size) VALUES
(1,1,100,12.00,'SMALL'),
(1,2,50,22.00,'MEDIUM'),
(1,3,20,35.00,'LARGE'),
(2,4,30,30.00,'MEDIUM'),
(2,5,20,30.00,'SMALL');

INSERT INTO sales
(vendor_id, sale_date, payment_status, total_amount, payment_method, amount_paid) VALUES
(1,'2026-10-05','PAID',500.00,'CASH',500.00),
(2,'2026-10-06','PARTIALLY_PAID',600.00,'MOBILE_MONEY',300.00),
(3,'2026-10-07','UNPAID',350.00,'CREDIT',0.00);

INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price) VALUES
(1,1,'SMALL',10,20.00),
(1,2,'MEDIUM',10,30.00),
(2,3,'LARGE',10,60.00),
(3,4,'MEDIUM',5,70.00);

INSERT INTO stock (fruit_id, packaging_size, available_quantity) VALUES
(1,'SMALL',90),(1,'MEDIUM',0),(1,'LARGE',0),
(2,'SMALL',0),(2,'MEDIUM',40),(2,'LARGE',0),
(3,'SMALL',0),(3,'MEDIUM',0),(3,'LARGE',10),
(4,'SMALL',0),(4,'MEDIUM',25),(4,'LARGE',0),
(5,'SMALL',20),(5,'MEDIUM',0),(5,'LARGE',0);


SELECT * FROM suppliers;
SELECT * FROM fruits;
SELECT * FROM vendors;
SELECT * FROM stock ORDER BY fruit_id, packaging_size;
