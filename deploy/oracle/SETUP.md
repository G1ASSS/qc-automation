# Oracle Always Free deployment runbook (Ampere ARM, Singapore)

Target: 1× VM.Standard.A1.Flex (2 OCPU / 12 GB, Ubuntu 24.04, 100 GB boot),
Docker Compose running db + app + Caddy, HTTPS via `<ip-with-dashes>.nip.io`.

## 0. Account (owner does this once)

1. Sign up at oracle.com/cloud/free. Choose home region **Singapore**
   (`ap-singapore-1`) — free resources only live in the home region.
2. Verify mobile + card (temporary hold only).
3. If Ampere shows "out of capacity", wait and retry, or try another
   availability domain in the same region.

## 1. Network (OCI console)

VCN wizard → public subnet. In the public subnet's **security list** add
ingress rules (stateless off, source `0.0.0.0/0`):
- TCP 22 (SSH), TCP 80 (HTTP), TCP 443 (HTTPS).

## 2. Instance

Create Ampere A1 Flex: 2 OCPU, 12 GB RAM, Ubuntu 24.04, 100 GB boot volume,
public subnet, assign public IP. Download the SSH private key.
Note the public IPv4, e.g. `203.0.113.5` → host `qc-203-0-113-5.nip.io`.

## 3. Server prep (SSH as `ubuntu`)

```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# (re-login so the group applies)

# Ubuntu on OCI blocks everything by default — open web + ssh
sudo iptables -I INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save

git clone https://github.com/G1ASSS/qc-automation.git qc
cd qc
```

## 4. Environment

Create `.env` on the server (copy values from the old host — never commit):

```bash
NODE_ENV=production
PORT=3000
DB_PASSWORD=<long-random-password>
TELEGRAM_BOT_TOKEN=<from old host>
TELEGRAM_WEBHOOK_SECRET=<from old host, keep it>
PUBLIC_BASE_URL=https://<your-nip-io-host>
PUBLIC_HOST=<your-nip-io-host>
GOOGLE_SHEET_ID=<from old host>
GOOGLE_SERVICE_ACCOUNT_JSON=<from old host>
GOOGLE_SHEET_TAB=<from old host>
ALLOWED_TELEGRAM_CHAT_IDS=<from old host>
LOG_LEVEL=info
ADMIN_TOKEN=<from old host, keep it>
```

Then start with the Oracle compose file:

```bash
docker compose -f deploy/oracle/docker-compose.yml up -d --build
docker compose -f deploy/oracle/docker-compose.yml logs -f app  # wait for "listening"
```

Migrations run automatically on container start.

## 5. Restore data (no duplicate sheet rows)

```bash
# from your Mac:
scp PROD-BACKUP-20261015.json ubuntu@<ip>:~/qc/backup.json
# on the server:
docker compose -f deploy/oracle/docker-compose.yml cp backup.json app:/tmp/backup.json
docker compose -f deploy/oracle/docker-compose.yml exec app node scripts/restore-backup.mjs /tmp/backup.json
```

Verify: `curl http://localhost:3000/health` on the server, and
`https://<your-nip-io-host>/api/qc?limit=1` shows the row count.

## 6. Point Telegram at the new host

```bash
npm run telegram:set-webhook -- --url=https://<your-nip-io-host>
```

Check the group: send a report → confirmation reply → row in DB/sheet/site.
Keep the old host running until this is green, then tear it down.
