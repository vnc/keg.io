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
	CREATE TABLE coaster(coaster_id int, description varchar(255), image_path varchar(255));        
	INSERT INTO coaster(coaster_id, description, image_path) VALUE(1, 'Welcome', 'images/coasters/firstbeer.jpg');
	INSERT INTO coaster(coaster_id, description, image_path) VALUE(2, 'Early bird', 'images/coasters/earlybird.jpg');
	
	CREATE TABLE user_coaster(rfid varchar(10), coaster_id int);
COMMIT;