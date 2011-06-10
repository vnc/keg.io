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
	UPDATE pour SET pour_date = CASE WHEN pour_date2 IS NULL THEN pour_date ELSE pour_date2 END;  
	                                                                         
	-- Clean up malformed/test dates
	DELETE FROM pour WHERE pour_date = '';
	DELETE FROM pour WHERE pour_date IS NULL;  
	                                         
	-- Clean up empty pours
	DELETE FROM pour WHERE volume_ounces = 0;
	                                
	-- Attribute old pours to the correct kegs, but only if no pours are already
	-- attributed to them
	UPDATE pour  
	SET keg_id = CASE WHEN EXISTS (SELECT 1 FROM pour WHERE keg_id = 4 LIMIT 1) THEN keg_id ELSE 4 END
    WHERE pour_date >= '2011-05-13T15:37:45Z';
                                  
    UPDATE pour  
	SET keg_id = CASE WHEN EXISTS (SELECT 1 FROM pour WHERE keg_id = 3 LIMIT 1) THEN keg_id ELSE 3 END
    WHERE pour_date < '2011-05-13T15:37:45Z'
      AND pour_date >= '2011-04-22T13:23:45Z';

	 UPDATE pour  
	 SET keg_id = CASE WHEN EXISTS (SELECT 1 FROM pour WHERE keg_id = 2 LIMIT 1) THEN keg_id ELSE 2 END
	 WHERE pour_date < '2011-04-22T13:23:45Z'
	   AND pour_date >= '2011-04-08T16:30:45Z';
	
COMMIT;  

BEGIN TRANSACTION;
	CREATE TABLE coaster(coaster_id int, name varchar(64), description varchar(255), image_path varchar(255));        
    INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (1, 'Welcome', 'Pour a beer with keg.io!', 'images/coasters/firstbeer.png');
	INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (2, 'Early Bird', 'Pour a beer before noon.', 'images/coasters/earlybird.png');   
	INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (3, 'Mayor', 'Become the current top drinker', 'images/coasters/mayor.png');  
	INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (4, 'Keg Mayor', 'Become the top drinker on a keg.', 'images/coasters/kegmayor.png');     
	INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (5, 'Party Starter', 'Pour the first beer of the day', 'images/coasters/first.png');      
	INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (6, 'Closer', 'Pour the last beer of the day', 'images/coasters/closer.png');      
	INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (7, 'Off the Wagon', 'Pour a beer after a 3 week absence', 'images/coasters/wagon.png');  
	INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (8, 'Take the Bus Home', 'Pour 4 or more pints in an hour', 'images/coasters/bus.png');
	INSERT INTO coaster(coaster_id, name, description, image_path) VALUES (9, 'Contributor', 'Contribute to the keg.io code on github', 'images/coasters/contributor.png');     
	
	CREATE TABLE user_coaster(rfid varchar(10), coaster_id int, earned_date date);   
	
	-- Everyone gets the "welcome" coaster to start off with
	INSERT INTO user_coaster(rfid, coaster_id, earned_date)
	SELECT rfid, 1, MIN(pour_date)
	FROM pour
	WHERE rfid NOT IN (SELECT rfid 
					   FROM user_coaster 
					   WHERE coaster_id = 1)
	GROUP BY rfid;
	
	-- For now, we'll just have to hardcode the list of who gets a "contributor" coaster
	INSERT INTO user_coaster(rfid, coaster_id, earned_date)
	SELECT rfid, 9, MIN(pour_date)
	FROM pour 
	WHERE rfid IN ('44004C234A', '44004C3A1A', '4400561A0A', '440055F873') 
	  AND rfid NOT IN (SELECT rfid 
					   FROM user_coaster 
					   WHERE rfid IN ('44004C234A', '44004C3A1A', '4400561A0A', '440055F873' ) 
					     AND coaster_id = 9)
	GROUP BY rfid;
	
COMMIT;

BEGIN TRANSACTION;
	ALTER TABLE coaster ADD COLUMN audio_path varchar(255);
COMMIT;
BEGIN TRANSACTION;
	UPDATE coaster
	set audio_path = 'audio/firstbeer.mp3'
	where coaster_id = 1;
	
	UPDATE coaster
	set audio_path = 'audio/earlybird.mp3'
	where coaster_id = 2;
	
	UPDATE coaster
	set audio_path = 'audio/mayor.mp3'
	where coaster_id = 3;
	
	UPDATE coaster
	set audio_path = 'audio/kegmayor.mp3'
	where coaster_id = 4;
	
	UPDATE coaster
	set audio_path = 'audio/partystarter.mp3'
	where coaster_id = 5;
	
	UPDATE coaster
	set audio_path = 'audio/closer.mp3'
	where coaster_id = 6;
	
	UPDATE coaster
	set audio_path = 'audio/wagon.mp3'
	where coaster_id = 7;
	
	UPDATE coaster
	set audio_path = 'audio/bus.mp3'
	where coaster_id = 8;
	
	COMMIT;
