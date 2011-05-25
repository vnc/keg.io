#!/bin/bash
cur_dir=`pwd`
forever start -a -l ${cur_dir}/log/daemon.log -o log/out.log -e log/err.log server.js conf/configuration.json
