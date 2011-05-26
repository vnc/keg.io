CREATE TABLE user(rfid varchar(10), first_name varchar(64), last_name varchar(64), nickname varchar(255), email varchar(255), twitter_handle varchar(255));
CREATE TABLE keg(keg_id int, beer varchar(64), brewery varchar(64), beer_style varchar(255), description varchar(256), tapped_date datetime, 
				 volume_gallons real, active boolean, image_path varchar(255));
CREATE TABLE pour(rfid varchar(10), keg_id int, pour_date date, volume_ounces int);
CREATE TABLE temperature(temperature int, temperature_date date);  
CREATE TABLE coaster(coaster_id int, name varchar(64), description varchar(255), image_path varchar(255));    
CREATE TABLE user_coaster(rfid varchar(10), coaster_id int, earned_date date);   

INSERT INTO user(rfid, first_name, last_name, nickname, email, twitter_handle) VALUES('2312A4B540', 'Dylan', 'Carney', 'Beardo', 'dcarney@gmail.com', '@_dcarney_');
INSERT INTO user(rfid, first_name, last_name, nickname, email, twitter_handle) VALUES('2312A4B541', 'Chris', 'Castle', '', 'crcastle@gmail.com', '@crc');
INSERT INTO user(rfid, first_name, last_name, nickname, email) VALUES('2312A4B542', 'Carl', 'Krauss', '', '');
INSERT INTO user(rfid, first_name, last_name, nickname, email, twitter_handle) VALUES('2312A4B543', 'Garrett', 'Patterson', '', 'garrett.patterson@vivaki.com', '@thegarrettp');

INSERT INTO keg(keg_id, beer, brewery, beer_style, description, tapped_date, volume_gallons, active, image_path) 
VALUES(1, 'Manny''s', 'Georgetown Brewery', 'Pale Ale', 'A solid pale ale, brewed in Seattle least-douchey neighborhood.', 
	   '2011-03-12T01:23:45Z', 15.5, 'false', 'images/MannysPint3.gif'); 
	
INSERT INTO keg(keg_id, beer, brewery, beer_style, description, tapped_date, volume_gallons, active, image_path) 
VALUES(2, 'Lucile', 'Georgetown Brewery', 'IPA', 'Floral, citrusy and awesome. Anything so innocent and built like that just gotta be named Lucille.', 
		   '2011-04-08T16:30:45Z', 7.75, 'false', 'images/MannysPint3.gif');
		
INSERT INTO keg(keg_id, beer, brewery, beer_style, description, tapped_date, volume_gallons, active, image_path) 
VALUES(3, 'Curveball', 'Pyramid Brewery', 'Blonde Ale', 'A summery blend of, of... hops and bubbles. --Garrett Patterson', 
		   '2011-04-22T13:23:45Z', 15.5, 'false', 'images/curveball.jpg');         
		
INSERT INTO keg(keg_id, beer, brewery, beer_style, description, tapped_date, volume_gallons, active, image_path) 
VALUES(4, 'Immortal', 'Elysian Brewery', 'IPA', 'A Northwest interpretation of a classic English style, golden copper in color and loaded with New World hop flavor and aroma.', 
			   '2011-05-13T15:37:45Z', 15.5, 'true', 'images/immortal.jpg');
  
INSERT INTO temperature(temperature, temperature_date) VALUES (39, '2011-03-12 01:23:46.666');
INSERT INTO temperature(temperature, temperature_date) VALUES (39, '2011-03-12 01:23:47.666');
INSERT INTO temperature(temperature, temperature_date) VALUES (39, '2011-03-12 01:23:48.666');

INSERT INTO pour(rfid, keg_id, pour_date, volume_ounces) VALUES ('2312A4B541', 1, '2011-03-19T16:34:17Z', 16);
INSERT INTO pour(rfid, keg_id, pour_date, volume_ounces) VALUES ('2312A4B542', 1, '2011-03-19T16:38:17Z', 32);           

INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (1, 'Welcome', 'Pour a beer with keg.io!', 'images/coasters/firstbeer.jpg');
INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (2, 'Early bird', 'Pour a beer before noon.', 'images/coasters/earlybird.jpg');   
INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (3, 'Mayor', 'Become the current top drinker', 'images/coasters/mayor.jpg');  
INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (4, 'Keg Mayor', 'Become the top drinker on a keg.', 'images/coasters/kegmayor.jpg');     
INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (5, 'Party starter', 'Pour the first beer of the day', 'images/coasters/first.jpg');      
INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (6, 'Closer', 'Pour the last beer of the day', 'images/coasters/closer.jpg');      
INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (7, 'Off the wagon', 'Pour a beer after a 2 week absence', 'images/coasters/wagon.jpg');  
INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (8, 'Take the bus home', 'Pour 4 or more beers in an hour', 'images/coasters/bus.jpg');      


INSERT INTO user_coaster(rfid, coaster_id, earned_date) VALUES('2312A4B540', 3, '2011-05-19T18:38:17Z');      
INSERT INTO user_coaster(rfid, coaster_id, earned_date) VALUES('2312A4B542', 2, '2011-05-19T18:38:17Z');    
INSERT INTO user_coaster(rfid, coaster_id, earned_date) VALUES('2312A4B542', 3, '2011-05-19T18:38:17Z');    
INSERT INTO user_coaster(rfid, coaster_id, earned_date) VALUES('2312A4B542', 4, '2011-05-19T18:38:17Z');    
INSERT INTO user_coaster(rfid, coaster_id, earned_date) VALUES('2312A4B542', 5, '2011-05-19T18:38:17Z');    
INSERT INTO user_coaster(rfid, coaster_id, earned_date) VALUES('2312A4B542', 6, '2011-05-19T18:38:17Z');    
INSERT INTO user_coaster(rfid, coaster_id, earned_date) VALUES('2312A4B543', 2, '2011-05-19T18:38:17Z');     
