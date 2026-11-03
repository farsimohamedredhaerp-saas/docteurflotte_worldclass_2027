/**
 * ==============================================================================
 * DOCTEURFLOTTE — Module d'Empreinte Matérielle (Hardware Fingerprint)
 * ==============================================================================
 * Calcule un identifiant cryptographique unique et résistant à la falsification
 * basé sur les composants physiques de la machine hôte :
 * - UUID de la carte mère (DMI / BIOS / Chassis)
 * - Adresse MAC de la carte réseau primaire physique
 * - Identifiant et architecture du processeur (CPU ID)
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';

export class HardwareFingerprint {
  private static readonly SALT = 'DOCTEURFLOTTE_SOVEREIGN_HARDWARE_INTEGRITY_SALT_2026_DZ';

  /**
   * Récupère l'UUID matériel de la machine selon le système d'exploitation
   */
  public static getMotherboardUuid(): string {
    const platform = os.platform();

    if (platform === 'linux') {
      // 1. DMI product_uuid (serveurs physiques et hyperviseurs KVM/VMware)
      const dmiPaths = [
        '/sys/class/dmi/id/product_uuid',
        '/sys/devices/virtual/dmi/id/product_uuid',
        '/etc/machine-id',
        '/var/lib/dbus/machine-id',
      ];

      for (const p of dmiPaths) {
        try {
          if (fs.existsSync(p)) {
            const uuid = fs.readFileSync(p, 'utf8').trim();
            if (uuid && uuid !== '00000000-0000-0000-0000-000000000000') {
              return uuid;
            }
          }
        } catch {
          // Ignorer et essayer le suivant
        }
      }

      // Fallback commande Linux dmidecode
      try {
        const out = execSync('cat /sys/class/dmi/id/product_uuid 2>/dev/null || cat /etc/machine-id', {
          encoding: 'utf8',
          timeout: 1000,
        }).trim();
        if (out) return out;
      } catch {
        // Fallback
      }
    } else if (platform === 'win32') {
      // Windows : extraction via WMI / PowerShell
      try {
        const out = execSync('powershell.exe -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"', {
          encoding: 'utf8',
          timeout: 2000,
        }).trim();
        if (out && out.length > 8) return out;
      } catch {
        // Fallback WMIC
        try {
          const wmicOut = execSync('wmic csproduct get uuid', { encoding: 'utf8', timeout: 2000 });
          const match = wmicOut.replace(/uuid/i, '').trim();
          if (match) return match;
        } catch {
          // Fallback
        }
      }
    } else if (platform === 'darwin') {
      try {
        const out = execSync('ioreg -rd1 -c IOPlatformExpertDevice | grep -i IOPlatformUUID', {
          encoding: 'utf8',
          timeout: 1500,
        });
        const match = out.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
        if (match && match[1]) return match[1];
      } catch {
        // Fallback
      }
    }

    // Fallback résilient : hachage combiné hostname + userInfo
    return `FALLBACK-${os.hostname()}-${os.userInfo().username}`;
  }

  /**
   * Récupère l'adresse MAC de la première interface réseau physique réelle
   */
  public static getPrimaryMacAddress(): string {
    const interfaces = os.networkInterfaces();
    const candidates: string[] = [];

    for (const name of Object.keys(interfaces)) {
      // Ignorer interfaces virtuelles, loopback, docker et veth
      const lower = name.toLowerCase();
      if (
        lower.startsWith('lo') ||
        lower.startsWith('docker') ||
        lower.startsWith('veth') ||
        lower.startsWith('br-') ||
        lower.startsWith('tun')
      ) {
        continue;
      }

      const ifaceList = interfaces[name];
      if (ifaceList) {
        for (const iface of ifaceList) {
          if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
            candidates.push(iface.mac.toUpperCase());
          }
        }
      }
    }

    if (candidates.length > 0) {
      candidates.sort();
      return candidates[0];
    }

    return '00:00:00:00:00:00';
  }

  /**
   * Extrait l'empreinte processeur (Modèle + Architecture + Nombre de cœurs)
   */
  public static getCpuFingerprint(): string {
    const cpus = os.cpus();
    const model = cpus.length > 0 ? cpus[0].model : 'GENERIC_CPU';
    const cores = cpus.length;
    const arch = os.arch();

    return `${model}-${cores}-${arch}`;
  }

  /**
   * Génère l'empreinte matérielle complète canonique : DF-HWID-XXXX-XXXX-XXXX-XXXX
   */
  public static generateFingerprint(): string {
    const uuid = this.getMotherboardUuid();
    const mac = this.getPrimaryMacAddress();
    const cpu = this.getCpuFingerprint();

    const rawData = `${this.SALT}|UUID:${uuid}|MAC:${mac}|CPU:${cpu}`;

    const hash = crypto.createHash('sha256').update(rawData).digest('hex').toUpperCase();

    // Format lisible par bloc de 4 caractères
    const chunk1 = hash.substring(0, 4);
    const chunk2 = hash.substring(4, 8);
    const chunk3 = hash.substring(8, 12);
    const chunk4 = hash.substring(12, 16);

    return `DF-HWID-${chunk1}-${chunk2}-${chunk3}-${chunk4}`;
  }
}

