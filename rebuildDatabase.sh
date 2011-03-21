# delete the old backup if it exists
if [ -f kegerator.db.old ] 
then
  rm kegerator.db.old
fi

# move the current DB to the bakcup, if it exists
if [ -f kegerator.db ] 
then
  mv kegerator.db kegerator.db.old
fi

# create the new fresh DB
sqlite3 kegerator.db < kegerator.sql
