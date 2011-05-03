#! /bin/bash

# delete the old backup if it exists
if [ -f ../db/kegerator.db.old ] 
then
  rm ../db/kegerator.db.old
fi

# move the current DB to the bakcup, if it exists
if [ -f ../db/kegerator.db ] 
then
  mv ../db/kegerator.db ../db/kegerator.db.old
fi

# create the new fresh DB
sqlite3 ../db/kegerator.db < ../db/kegerator.sql
