# start the debugger in the bg
node-inspector & 
                                                         
# open a WebKit-enabled browser window for a debugger GUI
#
# assumes 'open' (mac os).  otherwise you can set the BROWSER env variable
# or just change this line..
if [ -z "${BROWSER}" ]; then
  # This works on Linux: 
  #  BROWSER="google-chrome"
  # This works on OS X:
  BROWSER="open"
fi
$BROWSER http://0.0.0.0:8080/debug?port=5858
                              
# start the keg.io process with the debug option enabled.
cd ..
node --debug server.js conf/configuration.json
                              
                       
