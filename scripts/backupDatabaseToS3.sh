#! /bin/bash
# Backs up the kegerator DB to S3, using a properly-configured instance of s3cmd
#
# usage: backupDatabaseToS3.sh s3bucketname
#
# assumptions:
#  - s3cmd is installed and on the path
#  - s3cmd is configured with the proper credentials for accessing the given bucketname
#
# NOTE:
# to get this script to run properly in cron, absolute paths may need to be given
# for both s3cmd and it's config file (~/.s3cfg), since cron uses different user env settings
#
# ex. /home/keg/local/bin/s3cmd --config /home/keg/.s3cfg blah blah blah

DATE="`date +%d-%b-%Y_%H%M%S`"
s3cmd put ../db/kegerator.db s3://$1/DBBackups/kegerator.db.$DATE
