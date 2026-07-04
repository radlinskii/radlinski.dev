---
title: "Immich Backup and restore guide"
description: "Guide for setting up Immich backup and walkthrough of using it to restore the service from the backup."
tldr: "Walkthrough of creating full backup for Immich and then how to test that the backup works"
pubDate: 2026-07-14
updatedDate: 2026-07-15
heroImage: "/posts/ergonomic-keyboard/mechabasilisk_3.jpeg"
heroImageAlt: "My Mecha Basilisk ergonomic keyboard"
---

I had to test my Immich backup setup is working to sleep well at night without worrying about my family photos archive. I've decided to note what I'm doing to also be able to know what to do in the worst case scenario when I would actually need to use the backup.

There are many "Immich setup" guides in the internet, there are also many "Backup guides", but I  didn't see any where people actually test properly if a full recovery of the backup works.  I've decided to share my notes then to create such backup. Who knows, maybe you'll find it helpful.

## Prerequisites

I'm not running the apps used in this guide using Docker. Instead I'm running them as LXC on Proxmox VE (Debian-based) v9.2.3.

### Creating the mount point

I will skip this step here. There are plenty of guides on how to do it. I had to actually resize the existing `lvm` to have space for the separate mount point for Immich, so just google how to create a new one. I might document that process of resizing existing one too, because it deserves a separate guide.

I will assume the mount point is already created and available at `/mnt/immich-media` from the proxmox host.

### Immich setup

Create new LXC for new Immich instance using the helper script: <https://community-scripts.org/scripts/immich>,

LXC id is `113`, Immich services are running by the `immich` user.

1. Stop the container after it is installed

```bash
pct stop 113
```

1. in the config of new lxc container add the mount point

```bash
nvim /etc/pve/lxc/113.conf
```

   and add:

```txt
mp0: /mnt/immich-media/,mp=/mnt/immich-media
```

1. inside the new LXC container run:

```bash
pct start 113
```

1. Set `/mnt/mmich-media/` as the location for uploads of the  Immich container. The following steps are taken from the official guide of the Immich LXC Helper Script - <https://github.com/community-scripts/ProxmoxVE/discussions/5075>
1. enter the container

    ```bash

pct enter 113
    ```
2. stop the immich app services
    ```bash
systemctl stop immich-web immich-ml
    ```
3. open env file
    ```bash
vi /opt/immich/.env
    ```
4. change the location env var
    ```
IMMICH_MEDIA_LOCATION=/mnt/immich-media
    ```
5. remove old symlinks created by the helper script
    ```bash
rm /opt/immich/app/upload
rm /opt/immich/app/machine-learning/upload
    ```
6. create new symlinks
    ```bash
ln -sf /mnt/immich-media /opt/immich/app/upload
ln -sf /mnt/immich-media /opt/immich/app/machine-learning/upload
    ```
7. ensure the ownership of the `immich` folder
    ```bash
chown -R immich:immich /opt/immich
    ```
8. restart the app services and preview logs
    ```bash
systemctl start immich-ml immich-web && tail -f /var/log/immich/web.log
    ```
9.  Optional: once the app is confirmed to be working the old upload folder can be deleted
    ```bash
rm -rf /opt/immich/upload
    ```
5. Confirm Immich app is working by navigating to the url printed in the log after the container was created and e.g. uploading some files there.

### Backrest setup

Setup LXC using helper script with default settings: <https://community-scripts.org/scripts/backrest>

LXC id is 114, backrest is running by the `root` user.

### Giving access to the mount point for both Immich and Backrest

1. stop both services from running

```bash
pct stop 113
pct stop 114
```

1. created group:

```bash
groupadd -g 20000 immich-media
```

1. change the `/etc/subgid`

```bash
echo 'root:20000:1' >> /etc/subgid
```

1. modify the lxc configs, to both `/etc/pve/lxc/113.conf` and `/etc/pve/lxc/114.conf` add lines:

```txt
mp0: /mnt/immich-media,mp=/mnt/immich-media

lxc.idmap: u 0 100000 65536
lxc.idmap: g 0 100000 20000
lxc.idmap: g 20000 20000 1
lxc.idmap: g 20001 120001 45535
```

1. Set filesystem permissions on the host:

```bash
chgrp -R 20000 /mnt/immich-media
chmod -R g+rwX /mnt/immich-media
find /mnt/immich-media -type d -exec chmod g+s {} +
setfacl -R -d -m g:20000:rwX /mnt/immich-media
```

1. create the group and add service users inside each container

```bash
pct start 113
pct start 114
pct exec 113 -- bash -c "groupadd -g 20000 sharedmedia && usermod -aG sharedmedia immich"
pct exec 114 -- bash -c "groupadd -g 20000 sharedmedia && usermod -aG sharedmedia root"
pct reboot 113
pct reboot 114
```

1. verify the access rights

```bash
pct exec 113 - su -s /bin/bash immich -c "touch /mnt/immich-media/.test1 && rm /mnt/immich-media/.test1 && echo OK"
pct exec 114 - bash -c "touch /mnt/immich-media/.test2 && rm /mnt/immich-media/.test2 && echo OK"
```

## Backup setup

A prerequisite here would be to create an account in Backblaze.

### Backrest plan and repository setup

I followed the guide here: <https://www.linuxserver.io/blog/backup-your-data-to-b2-with-restic-and-backrest> to setup the backup plan and `restic` repository on Backblaze B2. I won't copy it's instructiions, but thanks to backrest UI I can easily show the end result using json format. Using those JSONs and the above guide the UI configuration can be replicated easily enough I think.

Repository config:

```json
`{ "id": "immich-backup", "uri": "s3://s3.eu-central-003.backblazeb2.com/<bucketName>", "password": "<pass>", "env": [ "AWS_ACCESS_KEY_ID=<keyId>", "AWS_SECRET_ACCESS_KEY=<applicationKey>" ], "flags": [], "prunePolicy": { "schedule": { "cron": "0 0 1 * *", "clock": "CLOCK_LAST_RUN_TIME" }, "maxUnusedBytes": "0", "maxUnusedPercent": 10 }, "hooks": [], "autoUnlock": false, "checkPolicy": { "schedule": { "cron": "0 1 */7 * *", "clock": "CLOCK_LAST_RUN_TIME" } }, "commandPrefix": { "ioNice": "IO_DEFAULT", "cpuNice": "CPU_DEFAULT" }, "guid": "<someId>", "autoInitialize": false, "shared": false, "originInstanceId": "", "forgetPolicy": { "schedule": { "cron": "0 2 * * *", "clock": "CLOCK_LAST_RUN_TIME" }, "retention": { "policyTimeBucketed": { "hourly": 0, "daily": 14, "weekly": 8, "monthly": 12, "yearly": 2, "keepLastN": 0 } } } }`
```

Backup plan config:

```json
`{ "id": "my-immich-backup-daily", "repo": "immich-backup", "paths": [ "/mnt/immich-media/backups", "/mnt/immich-media/encoded-video", "/mnt/immich-media/library", "/mnt/immich-media/profile", "/mnt/immich-media/thumbs", "/mnt/immich-media/upload" ], "excludes": [], "retention": { "policyTimeBucketed": { "hourly": 24, "daily": 30, "weekly": 0, "monthly": 12, "yearly": 0, "keepLastN": 0 } }, "hooks": [ { "conditions": [ "CONDITION_SNAPSHOT_START" ], "onError": "ON_ERROR_FATAL", "actionCommand": { "command": "ssh immich /usr/local/bin/immich-backup-pre.sh" } }, { "conditions": [ "CONDITION_SNAPSHOT_END" ], "onError": "ON_ERROR_RETRY_10MINUTES", "actionCommand": { "command": "ssh immich /usr/local/bin/immich-backup-post.sh" } } ], "iexcludes": [], "backup_flags": [], "schedule": { "cron": "0 3 * * *", "clock": "CLOCK_LOCAL" }, "skipIfUnchanged": false }`
```

### Creating Immich database dump

Before creating a backup snapshot it is crucial to make sure to include an up-to-date database snapshot too. I do it  using Backrest backup Plan feature called Hooks. You can already see them in the JSONs above.

#### Coordination between Backrest and Immich containers

The problem there is that I want to create a db dump, as part of the Backrest workflow, but the db is in the Immich container, so I had to come up with a way to communicate at least from Backrest to Immich to invoke the creation of db snapshot. As both containers are unprivileged, the solution I chose was using `ssh`.

##### Step 1 - Install SSH Server on LXC 113

```bash
pct exec 113 -- bash -c "apt update && apt install -y openssh-server"
```

```bash
pct exec 113 -- systemctl enable --now ssh
```

##### Step 2 - Install SSH Client on LXC 114

```bash
pct exec 114 -- bash -c "apt update && apt install -y openssh-client"
```

##### Step 3 - Generate SSH Key on LXC 114

```bash
pct exec 114 -- ssh-keygen -t ed25519 -f /root/.ssh/id_ed25519_lxc_shared -N ""
```

The `root@backrest` comment at the end of the public key is just a label — SSH ignores it during authentication.

##### Step 4 - Copy Public Key to LXC 113

Get the public key:

```bash
pct exec 114 -- cat /root/.ssh/id_ed25519_lxc_shared.pub
```

Add it to LXC 113:

```bash
pct exec 113 -- mkdir -p /root/.ssh
```

```bash
pct exec 113 -- bash -c "echo '<public-key-here>' >> /root/.ssh/authorized_keys"
```

```bash
pct exec 113 -- chmod 700 /root/.ssh
pct exec 113 -- chmod 600 /root/.ssh/authorized_keys
```

##### Step 5 - Lock Down SSH on LXC 113

Edit `/etc/ssh/sshd_config` inside LXC 113, add:

```txt
PasswordAuthentication no
AllowUsers root@<LXC-114-IP>
```

Restart SSH:

```bash
pct exec 113 -- systemctl restart ssh
```

##### Step 6 - Create SSH Config on LXC 114

Create `/root/.ssh/config` inside LXC 114:

```txt
Host immich
    HostName <LXC-113-IP>
    User root
    IdentityFile /root/.ssh/id_ed25519_lxc_shared
```

Set permissions:

```bash
pct exec 114 -- chmod 600 /root/.ssh/config
```

##### Step 7 - Test SSH Connection

```bash
pct exec 114 -- ssh -o StrictHostKeyChecking=accept-new immich echo "SSH OK"
```

##### Step 8 - Test Running Scripts Remotely

```bash
pct exec 114 -- ssh immich /usr/local/bin/immich-backup-pre.sh
```

```bash
pct exec 114 -- ssh immich /usr/local/bin/immich-backup-post.sh
```

---

#### Pre-backup Backrest hook

Used for creating database dump as part of the backup snapshot. To make sure the database is in sync with the files I stop the Immich services to ensure there are no operations happening by any user during the creation of the backup.  It is set up in the Backrest UI.
Runs on event: `CONDITION_SNAPSHOT_START` added in the Backrest Plan.  It is a `Command` hook, with `ON_ERROR_FATAL` error behavior, because I don't want to create a backup if it fails.

The command itself is just one line:

```bash
ssh immich /usr/local/bin/immich-backup-pre.sh
```

> After the first attempt of doing the restore I had to modify the script to make sure the db dump file has correct name that Immich expects. I think the timestamp and the app and postgres versions parts are the most important there.

#### Pre-backup hook script

In the Immich container:

```bash
pct enter 113
```

Saved as:

```bash
vi /usr/local/bin/immich-backup-pre.sh
```

and set to be executable with:

```bash
chmod +x /usr/local/bin/immich-backup-pre.sh
```

Content:

```bash
#!/bin/bash
set -euo pipefail

DUMP_DIR="/mnt/immich-media/backups"
PG_USER="immich"
PG_PASS=":-)"
PG_DB="immich"
PG_HOST="127.0.0.1"

# logging helper
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log "Starting Immich backup preparation"

# Stop Immich services
log "Stopping Immich serivces..."
systemctl stop immich-web immich-ml
log "Immich services stopped"

# Wait briefly for any in-flight writes to settle
sleep 2

# Dump database to a temp file (atomic replace)
log "Dumping database..."

IMMICH_VERSION=$(npx immich --version)
TIMESTAMP=$(date +%Y%m%dT%H%M%S)

PG_VERSION_RAW=$(sudo -u postgres psql -qtAX -c "SHOW server_version;")
PG_VERSION=$(echo "$PG_VERSION_RAW" | grep -oE '^[0-9]+\.[0-9]+')
PG_TAG="pg${PG_VERSION}"

DUMP_FILENAME="uploaded-custom-immich-db-backup-${TIMESTAMP}-v${IMMICH_VERSION}-${PG_TAG}.sql.gz"
DUMP_FILE="$DUMP_DIR/$DUMP_FILENAME"
DUMP_TMP="$DUMP_DIR/$DUMP_FILENAME.tmp"

PGPASSWORD="$PG_PASS" pg_dump -U "$PG_USER" -h "$PG_HOST" "$PG_DB" | gzip > "$DUMP_TMP"

# Verify the dump is not empty
if [ ! -s "$DUMP_TMP" ]; then
 log "ERROR: Database dump is empty!"
 exit 1
fi

# Atomic move into place
mv "$DUMP_TMP" "$DUMP_FILE"
log "Database dump saved to $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"

# Stop Postgres
log "stopping PostgreSQL"
systemctl stop postgresql
log "PostgreSQL stopped"

log "Backup preparatoin complete"

```

#### Post-backup Backrest hook

Runs after the snapshot finishes. On both failure and success. It's only there to restart the services that the `pre hook` stopped.  It is set up in the Backrest UI.

Runs on event: `CONDITION_SNAPSHOT_END` added in the Backrest Plan.  It is a `Command` hook, with `ON_ERROR_RETRY_10MINUTES` error behavior.

This command is also a one-liner:

```bash
ssh immich /usr/local/bin/immich-backup-post.sh
```

Saved **in the Immich container** as:

```bash
vi /usr/local/bin/immich-backup-post.sh
```

and set to be executable with:

```bash
chmod +x /usr/local/bin/immich-backup-post.sh
```

Content:

```bash
#!/bin/bash
set -uo pipefail

# logging helper
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

ERRORS=0

log "Starting Immich services recovery"

# Start Postgres first (other services depend on it)

log "Starting PostgreSQL..."

if systemctl start postgresql; then
 log "PostgreSQL started"
else
 log "ERROR: Failed to start PostgreSQL"
 ERRORS=$((ERRORS + 1))
fi

# Wait for Postgrs to be ready before starting Immich
if command -v pg_isready $>/dev/null; then
 log "Waiting for PostgreSQL to accept connections..."
 for i in $(seq 1 60); do
  if pg_isready -U postgres &>/dev/null; then
   log "PostgreSQL is ready"
   break
  fi
  if [ "$i" -eq 60 ]; then
   log "WARNING: PostgreSQL not ready after 60 seconds, starting services anyway"
  fi
  sleep 1
 done
fi

# Start Immich services
log "Starting Immich services..."
if systemctl start immich-ml immich-web; then
 log "Immich services statred"
else
 log "ERROR: Failed to start Immich services!"
 ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
 log "WARNING: Complteed with $ERRORS error(s)"
 exit 1
fi

log "All services recovered successfully"

```

## Full backup restore procedure

1. download backup the `backrest` to  `/mnt/immich-media/backup-test/2` or something
2. After the files are downloaded check the permissions, they should operate on the group `immich-media` with gid `20000` so group should have `rwx` permissions set when doing doing `ls`.  Also you can use `getfacl` to see the default ACL, it should be there in place already

- in case permissions are wrong, run (on the host):

```bash
chmod -R g+rwX /mnt/immich-media/test-backup2
setfacl -R -d -m g:20000:rwX /mnt/immich-media/test-backup2
```

1. Check the exact path of the immich directories, during the test it was

```txt
/mnt/immich-media/test-backup2/immich-media/
```

1. Create new LXC for new Immich instance using the helper script: <https://community-scripts.org/scripts/immich>,
2. Stop the container after it is installed

```bash
pct stop 115
```

1. in the config of new lxc container add mount point and  id mappings

```bash
nvim /etc/pve/lxc/115.conf
```

   and add:

```txt
mp0: /mnt/immich-media/test-backup2/immich-media/,mp=/mnt/immich-media

lxc.idmap: u 0 100000 65536
lxc.idmap: g 0 100000 20000
lxc.idmap: g 20000 20000 1
lxc.idmap: g 20001 120001 45535
```

1. inside the new LXC container run:

```bash
pct start 115
```

```bash
pct exec 115 -- bash -c "groupadd -g 20000 sharedmedia && usermod -aG sharedmedia immich"
```

```bash
pct reboot 115
```

1. Set `/mnt/immich-media/test-backup2/immich-media/` as the location for uploads of new Immich container. Steps taken from official guide of the Immich LXC Helper Script - <https://github.com/community-scripts/ProxmoxVE/discussions/5075>
1. enter the cotainer

    ```bash

pct enter 115
    ```
2. stop the immich app services
    ```bash
systemctl stop immich-web immich-ml
    ```
3. open env file
    ```bash
vi /opt/immich/.env
    ```
4. change the location env var
    ```
IMMICH_MEDIA_LOCATION=/mnt/immich-media
    ```
5. remove old symlinks created by the helper script
    ```bash
rm /opt/immich/app/upload
rm /opt/immich/app/machine-learning/upload
    ```
6. create new symlinks
    ```bash
ln -sf /mnt/immich-media /opt/immich/app/upload
ln -sf /mnt/immich-media /opt/immich/app/machine-learning/upload
    ```
7. ensure the ownership of the `immich` folder
    ```bash
chown -R immich:immich /opt/immich
    ```
8. restart the app services and preview logs
    ```bash
systemctl start immich-ml immich-web && tail -f /var/log/immich/web.log
    ```
9.  Optional: once the app is confirmed to be working the old upload folder can be deleted
    ```bash
rm -rf /opt/immich/upload
    ```
8. The backup contains DB dump. New immich instance should be able to be initialized using this db dump. <https://docs.immich.app/administration/backup-and-restore/#restore-from-onboarding>

### First restore test

The learnings from the first full restore test, that are already included in the notes above, so feel free to ignore them.

1. After backup is downloaded correct rights for group were not there.
   > Would be nice to fix it somehow, but can also be adjusted manually so `¯\_(ツ)_/¯.

2. IMO it's better to backup all *Immich related* directories (even /backups, /thumbs/ and /encoded-video) - I don't care so much about the space, I care more about the server overhead during e.g. transcoding all videos again. Also, when starting the new LXC the app expected /encoded-video and /thumbs directories to be there, and it was failing.
   > UPDATED the Backrest plan to include those directories.

3. The db_dump had "unrecognized version" error, and couldn't be used at first to restore the app. I had to rename it. Also, it's better to put it in the /backups directory, and just let it be one of the backups there, it will be the most recent one always.
    The name that worked for me: `"uploaded-custom-immich-db-backup-20260703T190154-v2.7.5-pg16.14.sql.gz"`.
    > UPDATED the Pre-backup hook script

### Second restore test

Second test was using a backup from Immich version 2.7.5 and a new Immich instance in LXC 115 with version 3.0.1, because there was a major update the day before the test. I was a bit nervous, but following this guide 1:1 this test worked flawlessly.

## Monitoring the backup

I wanted to have some kind of notification system in place in case the backup workflow fails.
Backrest is a good enough GUI for `restic` but I didn't see a notification system there.

I came up with a way for my Home Assistant instance to notify me on my phone.
The solution is very easy because the Home Assistant Webhook API doesn't use authentication, it treats the webhook URLs as unguessable secrets.

### Home Assistant automation

```yaml
alias: Immich Backup failure
description: Notify when Immich backup fails
triggers:
  - trigger: webhook
    allowed_methods:
      - POST
      - PUT
    local_only: true
    webhook_id: "<webhookId>"
conditions: []
actions:
 - action: persistent_notification.create
    data:
      title: Immich backup alert
      message: "{{ trigger.json.message }}"
      notification_id: backup failed
  - action: notify.send_message
    target:
      entity_id: notify.my_phone
    data:
      title: Immich backup alert
      message: "{{ trigger.json.message }}"
mode: single
```

### Handling failures in Backrest

In the Backrest backup plan I've added more hooks.
The hooks run on `CONDITION_SNAPSHOT_ERROR`, `CONDITION_CHECK_ERROR`, `CONDITION_FORGET_ERROR`, `CONDITION_PRUNE_ERROR`.  

The command is the same for all, and just changes the message to indicate which operation has failed.

```bash
curl -s -X POST http://<Home Assistant IP>/api/webhook/<webkhookId> \
-H "Content-Type: application/json" \
-d '{"message": "Immich backup SNAPSHOT/CHECK/FORGET/PRUNE failed"}'
```

With this setup, if any operation fails I will know to open Backrest and investigate.

> And they all have `ON_ERROR_IGNORE` error behavior, because well, that's the deepest I want to go for monitoring here. I will probably also create some periodic notification e.g. once a quarter to check the backups in backrest in case this "monitoring system fails."
