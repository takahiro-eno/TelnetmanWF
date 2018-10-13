TelnetmanWF (WorkFlow)
====

## Overview
This is a tool to create workflow with Telnetman.
![overview](https://github.com/takahiro-eno/TelnetmanWF/blob/demo/TelnetmanWF_overview.png)

## Install
### A. VM or Bare Metal
1. install minimal CentOS7
1. `git clone https://github.com/takahiro-eno/TelnetmanWF.git`
1. `cd TelnetmanWF`
1. `sudo sh TelnetmanWF_install.sh`
1. `cd ..`
1. `rm -rf TelnetmanWF`
1. `sudo reboot`

https&#58;//server address/
- - -

### B. Docker Container
1. `git clone https://github.com/takahiro-eno/Telnetman2.git`  
`git clone https://github.com/takahiro-eno/TelnetmanWF.git`
1. `cd TelnetmanWF`
1. `sudo docker-compose build`
1. `sudo docker-compose up -d`

https&#58;//host address:8443/  
https&#58;//host address:9443/
- - -

### C. OpenShift Origin v3.9
Structure  
![Demo](https://github.com/takahiro-eno/TelnetmanWF/blob/demo/TelnetmanWF-Container-Structure.png)

Make config file  
- PVC Config  
```
cat <<EOF > telnetmanwf-pvc.yml
apiVersion: "v1"
kind: "List"
items:

- apiVersion: "v1"
  kind: "PersistentVolumeClaim"
  metadata:
   name: "telnetmanwf-database"
  spec:
   accessModes:
    - ReadWriteMany
   resources:
     requests:
          storage: 2Gi
   storageClassName: "glusterfs-storage"

- apiVersion: "v1"
  kind: "PersistentVolumeClaim"
  metadata:
   name: "telnetmanwf-file"
  spec:
   accessModes:
    - ReadWriteMany
   resources:
     requests:
          storage: 2Gi
   storageClassName: "glusterfs-storage"
EOF
```
- Build config  
Set triggers arbitrarily.  
```
cat <<EOF > telnetmanwf-build.yml
apiVersion: "v1"
kind: "List"
items:

- apiVersion: "v1"
  kind: "ImageStream"
  metadata:
    name: "telnetmanwf-db"

- apiVersion: "v1"
  kind: "ImageStream"
  metadata:
    name: "telnetmanwf-mem"

- apiVersion: "v1"
  kind: "ImageStream"
  metadata:
    name: "telnetmanwf-web"

- apiVersion: "v1"
  kind: "ImageStream"
  metadata:
    name: "telnetmanwf-cron"
  
- apiVersion: "v1"
  kind: "BuildConfig"
  metadata:
    name: "telnetmanwf-db"
  spec:
    runPolicy: "Serial"
    source: 
      type: "Git"
      git:
        uri: "https://github.com/takahiro-eno/TelnetmanWF"
        ref: "master"
      contextDir: "./"
    strategy: 
      type: "Docker"
      dockerStrategy:
        dockerfilePath: "Dockerfile-db"
    output: 
      to:
        kind: "ImageStreamTag"
        name: "telnetmanwf-db:latest"
    triggers:
      -
        type: "GitHub"
        github:
          secret: "<SECRET>"

- apiVersion: "v1"
  kind: "BuildConfig"
  metadata:
    name: "telnetmanwf-mem"
  spec:
    runPolicy: "Serial"
    source: 
      type: "Git"
      git:
        uri: "https://github.com/takahiro-eno/TelnetmanWF"
        ref: "master"
      contextDir: "./"
    strategy: 
      type: "Docker"
      dockerStrategy:
        dockerfilePath: "Dockerfile-mem"
    output: 
      to:
        kind: "ImageStreamTag"
        name: "telnetmanwf-mem:latest"
    triggers:
      -
        type: "GitHub"
        github:
          secret: "<SECRET>"

- apiVersion: "v1"
  kind: "BuildConfig"
  metadata:
    name: "telnetmanwf-web"
  spec:
    runPolicy: "Serial"
    source: 
      type: "Git"
      git:
        uri: "https://github.com/takahiro-eno/TelnetmanWF"
        ref: "master"
      contextDir: "./"
    strategy: 
      type: "Docker"
      dockerStrategy:
        dockerfilePath: "Dockerfile-web"
        env:
          - name: "SSLPORT"
            value: "8443"
          - name: "DBSERVER"
            value: "telnetmanwf"
          - name: "MEMSERVER"
            value: "telnetmanwf"
          - name: "TELNETMA2"
            value: "telnetman2"
    output: 
      to:
        kind: "ImageStreamTag"
        name: "telnetmanwf-web:latest"
    triggers:
      -
        type: "GitHub"
        github:
          secret: "<SECRET>"

- apiVersion: "v1"
  kind: "BuildConfig"
  metadata:
    name: "telnetmanwf-cron"
  spec:
    runPolicy: "Serial"
    source: 
      type: "Git"
      git:
        uri: "https://github.com/takahiro-eno/TelnetmanWF"
        ref: "master"
      contextDir: "./"
    strategy: 
      type: "Docker"
      dockerStrategy:
        dockerfilePath: "Dockerfile-openshift-cron"
        env:
          - name: "DBSERVER"
            value: "telnetmanwf"
          - name: "MEMSERVER"
            value: "telnetmanwf"
          - name: "TELNETMA2"
            value: "telnetman2"
    output: 
      to:
        kind: "ImageStreamTag"
        name: "telnetmanwf-cron:latest"
    triggers:
      -
        type: "GitHub"
        github:
          secret: "<SECRET>"
EOF
```
- Deploy Config  
\<Project Name\> : Youer project name.  
\<openshift_master_default_subdomain\> : A value defined in inventory file.  
```
cat <<EOF > telnetmanwf-deploy.yml
apiVersion: "v1"
kind: "List"
items:

- apiVersion: "v1"
  kind: "Pod"
  metadata:
    name: "telnetmanwf"
    labels:
      deploymentconfig: "telnetmanwf"
  spec:
    containers:
      - name: "telnetmanwf-web"
        image: "docker-registry.default.svc:5000/<Project Name>/telnetmanwf-web:latest"
        ports:
          - containerPort: 8443
            protocol: "TCP"
        volumeMounts:
          - mountPath: "/var/TelnetmanWF"
            name: "telnetmanwf-file-dir"
      - name: "telnetmanwf-db"
        image: "docker-registry.default.svc:5000/<Project Name>/telnetmanwf-db:latest"
        ports:
          - containerPort: 3306
            protocol: "TCP"
        volumeMounts:
          - mountPath: "/var/lib/mysql/TelnetmanWF"
            name: "telnetmanwf-database-dir"
      - name: "telnetmanwf-mem"
        image: "docker-registry.default.svc:5000/<Project Name>/telnetmanwf-mem:latest"
        ports:
          - containerPort: 11211
            protocol: "TCP"
    volumes:
      - name: "telnetmanwf-file-dir"
        persistentVolumeClaim:
          claimName: "telnetmanwf-file"
      - name: "telnetmanwf-database-dir"
        persistentVolumeClaim:
          claimName: "telnetmanwf-database"

- apiVersion: "v1"
  kind: "Service"
  metadata:
    name: "telnetmanwf"
  spec:
    ports:
    - name: "8443-tcp"
      protocol: "TCP"
      port: 8443
      targetPort: 8443
    - name: "3306-tcp"
      protocol: "TCP"
      port: 3306
      targetPort: 3306
    - name: "11211-tcp"
      protocol: "TCP"
      port: 11211
      targetPort: 11211
    selector:
      deploymentconfig: "telnetmanwf"

- apiVersion: "v1"
  kind: "Route"
  metadata:
    name: "telnetmanwf"
  spec:
    host: "telnetmanwf-<Project Name>.<openshift_master_default_subdomain>"
    port:
      targetPort: "8443-tcp"
    tls:
      termination: "passthrough"
    to:
      kind: "Service"
      name: "telnetmanwf"
EOF
```
- CronJob Config  
\<Project Name\> : Youer project name.  
```
cat <<EOF > telnetmanwf-cron.yml
apiVersion: "v1"
kind: "List"
items:

- apiVersion: "batch/v2alpha1"
  kind: "CronJob"
  metadata:
    name: "telnetmanwf-check"
  spec:
    schedule: "*/1 * * * *"
    jobTemplate:
      spec:
        template:
          metadata:
            labels:
              parent: "telnetmanwf"
          spec:
            containers:
              - name: "telnetmanwf-check-10"
                image: "docker-registry.default.svc:5000/<Project Name>/telnetmanwf-cron:latest"
                command: ["perl", "/usr/local/TelnetmanWF/pl/check_status.pl",  "-w",  "10"]
                volumeMounts:
                  - mountPath: "/var/TelnetmanWF"
                    name: "telnetmanwf-file-dir"
              - name: "telnetmanwf-check-30"
                image: "docker-registry.default.svc:5000/<Project Name>/telnetmanwf-cron:latest"
                command: ["perl", "/usr/local/TelnetmanWF/pl/check_status.pl",  "-w",  "30"]
                volumeMounts:
                  - mountPath: "/var/TelnetmanWF"
                    name: "telnetmanwf-file-dir"
              - name: "telnetmanwf-check-50"
                image: "docker-registry.default.svc:5000/<Project Name>/telnetmanwf-cron:latest"
                command: ["perl", "/usr/local/TelnetmanWF/pl/check_status.pl",  "-w",  "50"]
                volumeMounts:
                  - mountPath: "/var/TelnetmanWF"
                    name: "telnetmanwf-file-dir"
            volumes:
              - name: "telnetmanwf-file-dir"
                persistentVolumeClaim:
                  claimName: "telnetmanwf-file"
            restartPolicy: "Never"

- apiVersion: "batch/v2alpha1"
  kind: "CronJob"
  metadata:
    name: "telnetmanwf-logrotate"
  spec:
    schedule: "42 4 1 * *"
    jobTemplate:
      spec:
        template:
          metadata:
            labels:
              parent: "telnetmanwf"
          spec:
            containers:
              - name: "telnetmanwf-logrotate"
                image: "docker-registry.default.svc:5000/<Project Name>/telnetmanwf-cron:latest"
                command: ["logrotate", "-s", "/var/TelnetmanWF/log/logrotate.status", "/etc/logrotate.d/TelnetmanWF"]
                volumeMounts:
                  - mountPath: "/var/TelnetmanWF"
                    name: "telnetmanwf-file-dir"
            volumes:
              - name: "telnetmanwf-file-dir"
                persistentVolumeClaim:
                  claimName: "telnetmanwf-file"
            restartPolicy: "Never"
EOF
```
1. `oc create -f telnetmanwf-pvc.yml`
1. `oc create -f telnetmanwf-build.yml`
1. `oc start-build telnetmanwf-db`  
`oc start-build telnetmanwf-web`  
`oc start-build telnetmanwf-cron`  
`oc start-build telnetmanwf-mem`  
wait for building
1. `oc create -f telnetmanwf-deploy.yml`
1. `oc create -f telnetmanwf-cron.yml`

https&#58;//telnetmanwf-\<Project Name\>.\<openshift_master_default_subdomain\>/
