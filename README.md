TelnetmanWF (WorkFlow)
====

## Overview
This is a tool to create workflow with Telnetman.
![overview](https://github.com/takahiro-eno/TelnetmanWF/blob/demo/TelnetmanWF_overview.png)

## Install
### VM or Bare Metal
1. install minimal CentOS7
1. `git clone https://github.com/takahiro-eno/TelnetmanWF.git`
1. `cd TelnetmanWF`
1. `sudo sh Telnetman2_install.sh`
1. `cd ..`
1. `rm -rf TelnetmanWF`
1. `sudo reboot`

https&#58;//server address/TelnetmanWF/

### Docker Container
1. `git clone https://github.com/takahiro-eno/Telnetman2.git`  
`git clone https://github.com/takahiro-eno/TelnetmanWF.git`
1. `mv ./TelnetmanWF/docker-compose.yml .`
1. `sudo docker-compose build`
1. `sudo docker-compose up -d`
1. `rm -rf Telnetman2 TelnetmanWF`

https&#58;//host address:8443/Telnetman2/  
https&#58;//host address:9443/TelnetmanWF/
