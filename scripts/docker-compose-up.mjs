/**
 * Runs `docker compose up -d` from the project root.
 * On Windows, uses Docker Desktop's docker.exe when `docker` is not on PATH,
 * and can start Docker Desktop when the daemon is not running.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

const DAEMON_WAIT_MS = 120_000;
const DAEMON_POLL_MS = 2_000;

function dockerDesktopBinExe() {
  if (platform() !== "win32") return null;
  const pf = process.env.ProgramFiles || "C:\\Program Files";
  const pf86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  for (const base of [pf, pf86]) {
    const p = join(base, "Docker", "Docker", "resources", "bin", "docker.exe");
    if (existsSync(p)) return p;
  }
  return null;
}

function dockerDesktopAppExe() {
  if (platform() !== "win32") return null;
  const pf = process.env.ProgramFiles || "C:\\Program Files";
  const pf86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  for (const base of [pf, pf86]) {
    const p = join(base, "Docker", "Docker", "Docker Desktop.exe");
    if (existsSync(p)) return p;
  }
  return null;
}

function dockerComposeWorks(exe) {
  const r = spawnSync(exe, ["compose", "version"], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    shell: false,
  });
  return r.status === 0;
}

function resolveDocker() {
  if (dockerComposeWorks("docker")) return "docker";
  const desktop = dockerDesktopBinExe();
  if (desktop && dockerComposeWorks(desktop)) return desktop;
  return null;
}

function isDockerDaemonReady(exe) {
  const r = spawnSync(exe, ["info", "--format", "{{.ServerVersion}}"], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    shell: false,
  });
  return r.status === 0 && Boolean(r.stdout?.trim());
}

function startDockerDesktop() {
  const app = dockerDesktopAppExe();
  if (!app) return false;
  try {
    spawn(app, [], { detached: true, stdio: "ignore" }).unref();
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDockerDaemon(exe) {
  if (isDockerDaemonReady(exe)) return true;

  if (platform() === "win32" && dockerDesktopAppExe()) {
    console.log(
      "Docker Desktop n’est pas démarré. Lancement en cours (icône baleine dans la barre des tâches)…"
    );
    if (!startDockerDesktop()) {
      console.error("Impossible de lancer Docker Desktop automatiquement.");
      return false;
    }

    const deadline = Date.now() + DAEMON_WAIT_MS;
    while (Date.now() < deadline) {
      await sleep(DAEMON_POLL_MS);
      if (isDockerDaemonReady(exe)) {
        console.log("Docker est prêt.\n");
        return true;
      }
    }
    return false;
  }

  return false;
}

function printDaemonHelp() {
  console.error(`
PostgreSQL via Docker nécessite que le moteur Docker soit actif.

Sur Windows :
  1. Ouvrez Docker Desktop depuis le menu Démarrer (icône baleine).
  2. Attendez « Docker Desktop is running ».
  3. Relancez : npm run db:up

Sans Docker : installez PostgreSQL localement et définissez DATABASE_URL dans .env
(ex. postgresql://postgres:postgres@localhost:5432/sofismart?schema=public).
`);
}

const docker = resolveDocker();
if (!docker) {
  console.error(
    "Docker n’a pas été trouvé. Installez Docker Desktop (https://www.docker.com/products/docker-desktop/), " +
      "puis rouvrez le terminal."
  );
  process.exit(1);
}

const ready = await ensureDockerDaemon(docker);
if (!ready) {
  printDaemonHelp();
  process.exit(1);
}

const res = spawnSync(docker, ["compose", "-f", "docker-compose.dev.yml", "up", "-d"], {
  cwd: projectRoot,
  stdio: "inherit",
  shell: false,
  env: process.env,
});

if (res.status !== 0) {
  const stderr = String(res.stderr ?? "");
  if (
    stderr.includes("dockerDesktopLinuxEngine") ||
    stderr.includes("cannot find the file specified")
  ) {
    printDaemonHelp();
  }
}

process.exit(res.status === 0 ? 0 : res.status ?? 1);
