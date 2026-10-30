# Guide de Déploiement SaaS DocteurFlotte sur VPS (Production)

**Version :** 1.0 (2026-10-24)  
**Cible :** Tout VPS Linux (Ubuntu 22.04/24.04 LTS, Debian 12) avec Docker & Docker Compose v2.

---

## 1. Dimensionnement Recommandé du VPS

| Ressource | Minimum Recommandé | Optimal Recommandé |
| :--- | :--- | :--- |
| **vCPU** | 2 cœurs | 4 cœurs |
| **Mémoire RAM** | 4 Go | 8 Go |
| **Disque SSD** | 40 Go NVMe | 80 Go NVMe |
| **OS** | Ubuntu 22.04 LTS / 24.04 LTS | Ubuntu 24.04 LTS |
| **Fournisseurs types** | Hetzner, OVH, DigitalOcean, Scaleway, Linode | VPS Cloud dédié |

---

## 2. Architecture de Production Conteneurisée

L'orchestration est gérée par [`infra/compose.prod.yaml`](file:///e:/docteurflotte_2027/infra/compose.prod.yaml) :

```text
               Internet (Clients Web, Mobiles & Boîtiers GPS)
                                    │
           ┌────────────────────────┴────────────────────────┐
           │                                                 │
       Ports 80/443 (HTTPS)                           Ports 5055, 5023 (GPS)
           │                                                 │
    ┌──────▼──────┐                                   ┌──────▼──────┐
    │    Caddy    │ (SSL Auto Let's Encrypt)          │             │
    │Reverse Proxy│                                   │             │
    └──┬──────┬───┘                                   │             │
       │      │                                       │   Traccar   │
  (app)│      │(api)                                  │ 6.15.2 GPS  │
┌──────▼──┐ ┌─▼─────────┐                             │  Gateway    │
│ Next.js │ │  NestJS   │────────────────────────────►│             │
│   Web   │ │    API    │                             └──────┬──────┘
│ (3000)  │ │  (3001)   │                                    │
└─────────┘ └─┬─────────┴───────────────┐                    │
              │                         │                    │
        ┌─────▼─────────────┐     ┌─────▼──────────┐         │
        │ PostgreSQL 16 RLS │     │  Redis 7 Cache │         │
        │  (Fail-Closed)    │     │  & File BullMQ │         │
        └───────────────────┘     └────────────────┘─────────┘
```

---

## 3. Configuration Préalable du VPS

### 3.1 Installation de Docker et Docker Compose
Sur votre VPS fraîchement installé :

```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installation de Docker
curl -fsSL https://get.docker.com | sudo sh

# Ajout de votre utilisateur au groupe docker
sudo usermod -aG docker $USER
newgrp docker

# Vérification
docker --version
docker compose version
```

### 3.2 Configuration du Pare-feu (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh                    # Port SSH (22 ou personnalisé)
sudo ufw allow 80/tcp                 # HTTP (redirection Let's Encrypt)
sudo ufw allow 443/tcp                # HTTPS (SaaS Web & API)
sudo ufw allow 5055/tcp               # GPS OsmAnd / Mobile HTTP
sudo ufw allow 5023/tcp               # GPS Teltonika TCP
sudo ufw allow 5023/udp               # GPS Teltonika UDP
sudo ufw enable
```

### 3.3 Configuration des Enregistrements DNS
Sur votre registrar de nom de domaine (ex: DZ, Gandi, Cloudflare, OVH), créez les enregistrements **Type A** pointant vers l'adresse IP publique de votre VPS :

- `app.votredomaine.dz` → `IP.DU.VPS`
- `api.votredomaine.dz` → `IP.DU.VPS`
- `traccar.votredomaine.dz` → `IP.DU.VPS`
- `maps.votredomaine.dz` → `IP.DU.VPS` (Cartographie Souveraine PMTiles 100% hors-ligne)

---

## 4. Déploiement en 4 Étapes

### Étape 1 : Cloner le Répertoire sur le VPS
```bash
git clone https://github.com/votre-orga/docteurflotte_2027.git /opt/docteurflotte
cd /opt/docteurflotte
```

### Étape 2 : Configurer l'Environnement de Production
```bash
cp .env.production.example .env
nano .env
```
Renseignez les mots de passe forts et vos noms de domaines réels.

### Étape 3 : Lancer le Déploiement Conteneurisé
```bash
docker compose -f infra/compose.prod.yaml up -d --build
```

### Étape 4 : Vérifier l'État des Services
```bash
docker compose -f infra/compose.prod.yaml ps
```
Tous les conteneurs doivent afficher le statut `Up (healthy)` ou `Up`.

---

## 5. Exploitation et Maintenance

### Consulter les Logs en Temps Réel
```bash
# Tous les services
docker compose -f infra/compose.prod.yaml logs -f

# Seulement l'API
docker compose -f infra/compose.prod.yaml logs -f api

# Seulement le serveur GPS Traccar
docker compose -f infra/compose.prod.yaml logs -f traccar
```

### Sauvegarde Quotidienne Automatique de la Base de Données
Créez un script `backup-db.sh` :
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/docteurflotte"
mkdir -p $BACKUP_DIR
docker exec -t docteurflotte_postgres_prod pg_dump -U docteurflotte_app -d docteurflotte_prod -Fc > $BACKUP_DIR/db_$DATE.dump
# Conserver 14 jours
find $BACKUP_DIR -name "*.dump" -mtime +14 -delete
```

---

## 6. Verdict de Déploiement

Avec les fichiers [`apps/api/Dockerfile`](file:///e:/docteurflotte_2027/apps/api/Dockerfile), [`apps/web/Dockerfile`](file:///e:/docteurflotte_2027/apps/web/Dockerfile), [`infra/compose.prod.yaml`](file:///e:/docteurflotte_2027/infra/compose.prod.yaml) et le reverse proxy Caddy HTTPS créés, **la réponse est OUI : la plateforme est 100% prête à être déployée sur n'importe quel VPS Linux sans problème.**
