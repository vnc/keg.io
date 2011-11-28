CREATE TABLE kegerator(kegerator_id int, name carchar(64), created_date datetime, owner_email varchar(255));

BEGIN TRANSACTION;
  ALTER TABLE keg ADD COLUMN kegerator_id int;
COMMIT;

BEGIN TRANSACTION;
  ALTER TABLE temperature ADD COLUMN kegerator_id int;
COMMIT;

BEGIN TRANSACTION;
  ALTER TABLE user_coaster ADD COLUMN kegerator_id int;
COMMIT;

INSERT INTO kegerator(kegerator_id, name, created_date, owner_email) 
VALUES(1111, 'Seattle', '2011-03-12T01:23:45Z', 'chris.castle@vivaki.com'); 

UPDATE keg SET kegerator_id=1111;

UPDATE temperature SET kegerator_id=1111;

UPDATE user_coaster SET kegerator_id=1111;