*********************************
(Initial) Setup:
*********************************
- This assumes you've already install a working copy of node.js, that is relatively recent (>= v0.4) 
  (If not, read/follow NODE-INSTALL)     

- This also assumes that you have npm (the defacto node.js package manager) installed.  If not, run:
	# curl http://npmjs.org/install.sh | sh
                   
- Get the code:
 	# git clone https://github.com/vnc/keg.io.git  
	# cd keg.io
	# git submodule update --init --recursive    
	
- If you're behind a restrictive firewall (like the one at VNC/RF), this will fail, because the port used 
  by the git:// protocol is blocked.  If this is the case, run the following command to force git to use
  HTTPS repository URLs:
	# git config --global url."https://".insteadOf git://        
	
- Build the sqlite drivers 
  (You DO have a C++ compiler installed, right?)
  (For OSX, make sure you have the XCode tools installed) 
  (For Ubuntu use: # sudo apt-get install "build-essential")
	# cd lib/node-sqlite
	# node-waf configure build 
	# cd ../..                 
	                          
- Install the twitter module and it's dependencies (since the git submodule doesn't seem to get it all)
	# npm install twitter
	                     
- If you plan on doing any interactive debugging of keg.io, install node-inspector
	# npm install node-insepctor
	
- Also install the forever module. This is used to ensure the node process is automatically restarted if it dies.
	# npm install forever
	
- Install the Sqlite cmd line shell and create the default Sqlite3 database: 
	# sudo apt-get install sqlite3
	# cd scripts
	# ./rebuildDatabase.sh  
	# cd ..                
	
- Set any necessary configuration options in the config file:
	# vi conf/configuration.json        
	      
*********************************                   
Running:                             
*********************************                                                  
- Run the node server:
	# scripts/prod-start.sh      
  (Depending on the USB port/HW/OS you're running on, you may need su privs to get node to open the 
   serial port)

- Connect a client UI by opening a browser and navigating to the proper IP/port, per the server's config.

- Stop the node server:
	# scripts/prod-stop.sh
                                                     
*********************************                      
Misc. Info:                      
*********************************
- Docco HTML documentation for the 'important' keg.io code can be found in the docs/ directory. 