#! /bin/bash
# Adds a user to the kegerator DB
#
# usage: inputUser rfid first_name last_name 

# capture stdout and stderr into a variable, using the backtick ` ` notation in BASH
result=`sqlite3 ../kegerator.db "INSERT INTO user(rfid, first_name, last_name) VALUES('$1', '$2', '$3')" 2>&1`

# the return code for the previous command is always stored in the $? var
if test $? -eq 0 
then echo "$2 $3 added"
else echo "ERROR: $result"
fi 

