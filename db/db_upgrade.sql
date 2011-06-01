BEGIN TRANSACTION;
	ALTER TABLE user ADD COLUMN email varchar(255);
COMMIT;    

BEGIN TRANSACTION;
	ALTER TABLE user ADD COLUMN twitter_handle varchar(255);
COMMIT;

BEGIN TRANSACTION;
	ALTER TABLE keg ADD COLUMN image_path varchar(255);
COMMIT; 

BEGIN TRANSACTION;
	ALTER TABLE keg ADD COLUMN volume_gallons real;
COMMIT;  

BEGIN TRANSACTION;
	ALTER TABLE keg ADD COLUMN beer_style varchar(255);
COMMIT;

BEGIN TRANSACTION;
	ALTER TABLE user ADD COLUMN nickname varchar(255);
COMMIT;                     


BEGIN TRANSACTION;
	ALTER TABLE pour ADD COLUMN pour_date2 datetime;  
	   
	-- Update May dates to ISO8601 format
	UPDATE pour SET pour_date2 = substr(pour_date, 12,4) || '-05-' || substr(pour_date, 9, 2) || 'T' || substr(pour_date, 17, 8) || 'Z' 
	WHERE substr(pour_date, 5, 3) = 'May';  
	
	-- Update April dates to ISO8601 format 
	UPDATE pour SET pour_date2 = substr(pour_date, 12,4) || '-04-' || substr(pour_date, 9, 2) || 'T' || substr(pour_date, 17, 8) || 'Z' 
	WHERE substr(pour_date, 5, 3) = 'Apr';
	
	-- Update March dates to ISO8601 format 
	UPDATE pour SET pour_date2 = substr(pour_date, 12,4) || '-03-'|| substr(pour_date, 9, 2) || 'T' || substr(pour_date, 17, 8) || 'Z' 
	WHERE substr(pour_date, 5, 3) = 'Mar';     
	
	-- Update the 'real' date column with our new parsed date column's values
	UPDATE pour SET pour_date = pour_date2;  
	                                                                         
	-- Clean up malformed/test dates
	DELETE FROM pour WHERE pour_date = '';
	DELETE FROM pour WHERE pour_date IS NULL;  
	                                         
	-- Clean up empty pours
	DELETE FROM pour WHERE volume_ounces = 0;
	                                
	-- Attribute old pours to the correct kegs
	UPDATE pour  
	SET keg_id = 4
    WHERE pour_date >= '2011-05-13T15:37:45Z';
                                  
    UPDATE pour  
	SET keg_id = 3
    WHERE pour_date < '2011-05-13T15:37:45Z'
      AND pour_date >= '2011-04-22T13:23:45Z';

	 UPDATE pour  
	 SET keg_id = 2
	 WHERE pour_date < '2011-04-22T13:23:45Z'
	   AND pour_date >= '2011-04-08T16:30:45Z';
	
COMMIT;  

BEGIN TRANSACTION;
	CREATE TABLE coaster(coaster_id int, name varchar(64), description varchar(255), image_path varchar(255));        
    INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (1, 'Welcome', 'Pour a beer with keg.io!', 'images/coasters/firstbeer.png');
	INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (2, 'Early bird', 'Pour a beer before noon.', 'images/coasters/earlybird.png');   
	INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (3, 'Mayor', 'Become the current top drinker', 'images/coasters/mayor.png');  
	INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (4, 'Keg Mayor', 'Become the top drinker on a keg.', 'images/coasters/kegmayor.png');     
	INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (5, 'Party starter', 'Pour the first beer of the day', 'images/coasters/first.png');      
	INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (6, 'Closer', 'Pour the last beer of the day', 'images/coasters/closer.png');      
	INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (7, 'Off the wagon', 'Pour a beer after a 2 week absence', 'images/coasters/wagon.png');  
	INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (8, 'Take the bus home', 'Pour 4 or more beers in an hour', 'images/coasters/bus.png');
	
	CREATE TABLE user_coaster(rfid varchar(10), coaster_id int, earned_date date);   
	
	-- Everyone gets the "welcome" coaster to start off with
	INSERT INTO user_coaster(rfid, coaster_id, earned_date)
	SELECT rfid, 1, MIN(pour_date)
	FROM pour
	GROUP BY rfid;
	
COMMIT;