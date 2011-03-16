CREATE TABLE user(first_name varchar(64), last_name varchar(64), rfid varchar(10));
CREATE TABLE keg(keg_id int, beer varchar(64), brewery varchar(64), description varchar(256), tapped_date datetime, killed_date datetime);
CREATE TABLE pour(rfid varchar(10), keg_id int, pour_date date, volume_ounces int);
CREATE TABLE temperature(temperature int, temperature_date date);

INSERT INTO user(rfid, first_name, last_name) VALUES('2312A4B540', 'Dylan', 'Carney');
INSERT INTO user(rfid, first_name, last_name) VALUES('2312A4B541', 'Chris', 'Castle');
INSERT INTO user(rfid, first_name, last_name) VALUES('2312A4B542', 'Carl', 'Krauss');

INSERT INTO keg(keg_id, beer, brewery, description, tapped_date) 
VALUES(1, 'Mannys Pale Ale', 'Georgetown Brewery', 'A solid pale ale, brewed in Seattle least-douchey neighborhood.', '2011-03-12 01:23:45.666');

INSERT INTO temperature(temperature, temperature_date) VALUES (39, '2011-03-12 01:23:46.666');
INSERT INTO temperature(temperature, temperature_date) VALUES (39, '2011-03-12 01:23:47.666');
INSERT INTO temperature(temperature, temperature_date) VALUES (39, '2011-03-12 01:23:48.666');
