const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const workspace = process.cwd();
const nextBin = require.resolve("next/dist/bin/next");
const prismaBin = require.resolve("prisma/build/index.js");
const ports = [3000, 3001, 3002, 5555];
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const dockerDesktopPath = "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe";
let nextChild = null;
let studioChild = null;

function runPowerShell(script) {
  return spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
    {
      cwd: workspace,
      encoding: "utf8"
    }
  );
}

function stopListeningPorts() {
  const result = runPowerShell(`
    $ports = @(${ports.join(",")})
    $processIds = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
      Where-Object { $ports -contains $_.LocalPort } |
      Select-Object -ExpandProperty OwningProcess -Unique
    if ($processIds) {
      Stop-Process -Id $processIds -Force -ErrorAction SilentlyContinue
      $processIds -join ","
    }
  `);

  if (result.stdout.trim()) {
    console.log(`[dev-single-instance] Da dung process giu port: ${result.stdout.trim()}`);
  }
}

function stopWorkspaceNextProcesses() {
  const escapedWorkspace = workspace.replace(/\\/g, "\\\\");
  const result = runPowerShell(`
    $workspace = "${escapedWorkspace}"
    $processIds = Get-CimInstance Win32_Process |
      Where-Object {
        $_.Name -eq "node.exe" -and
        $_.CommandLine -like "*$workspace*" -and
        (
          $_.CommandLine -like "*next\\\\dist\\\\bin\\\\next*" -or
          $_.CommandLine -like "*next\\\\dist\\\\server\\\\lib\\\\start-server.js*"
        )
      } |
      Select-Object -ExpandProperty ProcessId -Unique
    if ($processIds) {
      Stop-Process -Id $processIds -Force -ErrorAction SilentlyContinue
      $processIds -join ","
    }
  `);

  if (result.stdout.trim()) {
    console.log(
      `[dev-single-instance] Da dung Next process cua project: ${result.stdout.trim()}`
    );
  }
}

function stopWorkspacePrismaStudioProcesses() {
  const escapedWorkspace = workspace.replace(/\\/g, "\\\\");
  const result = runPowerShell(`
    $workspace = "${escapedWorkspace}"
    $processIds = Get-CimInstance Win32_Process |
      Where-Object {
        $_.Name -eq "node.exe" -and
        $_.CommandLine -like "*$workspace*" -and
        $_.CommandLine -like "*prisma*" -and
        $_.CommandLine -like "* studio*"
      } |
      Select-Object -ExpandProperty ProcessId -Unique
    if ($processIds) {
      Stop-Process -Id $processIds -Force -ErrorAction SilentlyContinue
      $processIds -join ","
    }
  `);

  if (result.stdout.trim()) {
    console.log(
      `[dev-single-instance] Da dung Prisma Studio process cua project: ${result.stdout.trim()}`
    );
  }
}

function removeNextCache() {
  const nextDir = path.join(workspace, ".next");
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log("[dev-single-instance] Da xoa cache .next");
  }

  const turboDir = path.join(workspace, ".turbo");
  if (fs.existsSync(turboDir)) {
    fs.rmSync(turboDir, { recursive: true, force: true });
    console.log("[dev-single-instance] Da xoa cache .turbo");
  }
}

function runCommand(command, args, label, options = {}) {
  console.log(`[dev-single-instance] ${label}`);

  const result = spawnSync(command, args, {
    cwd: workspace,
    env: process.env,
    encoding: "utf8",
    stdio: options.stdio ?? "inherit"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    if (options.stdio === "pipe") {
      if (result.stdout?.trim()) {
        console.log(result.stdout.trim());
      }

      if (result.stderr?.trim()) {
        console.error(result.stderr.trim());
      }
    }

    throw new Error(`${label} that bai`);
  }

  return result;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDockerReady() {
  const result = spawnSync("docker", ["info"], {
    cwd: workspace,
    env: process.env,
    encoding: "utf8",
    stdio: "pipe"
  });

  return result.status === 0;
}

function launchDockerDesktop() {
  if (!fs.existsSync(dockerDesktopPath)) {
    throw new Error(
      "Khong tim thay Docker Desktop. Hay cai Docker Desktop hoac tu bat PostgreSQL tren localhost:5432."
    );
  }

  console.log("[dev-single-instance] Docker Desktop chua chay, dang mo tu dong");

  const child = spawn("cmd.exe", ["/c", "start", "", dockerDesktopPath], {
    cwd: workspace,
    env: process.env,
    detached: true,
    stdio: "ignore"
  });

  child.unref();
}

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    const finish = (value) => {
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(1000);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, "127.0.0.1");
  });
}

async function ensureDatabaseServer() {
  if (await checkPort(5432)) {
    console.log("[dev-single-instance] PostgreSQL da san sang tai localhost:5432");
    return;
  }

  if (!isDockerReady()) {
    launchDockerDesktop();

    for (let attempt = 0; attempt < 45; attempt += 1) {
      if (isDockerReady()) {
        console.log("[dev-single-instance] Docker Desktop da san sang");
        break;
      }

      await wait(2000);
    }

    if (!isDockerReady()) {
      throw new Error(
        "Docker Desktop chua san sang. Hay doi Docker khoi dong xong roi chay lai lenh."
      );
    }
  }

  runCommand("docker", ["compose", "up", "-d", "postgres"], "Bat PostgreSQL bang Docker");

  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await checkPort(5432)) {
      console.log("[dev-single-instance] PostgreSQL da ket noi duoc");
      return;
    }

    await wait(1000);
  }

  throw new Error(
    "PostgreSQL khong san sang sau 30 giay. Kiem tra Docker Desktop hoac tien trinh Postgres."
  );
}

function syncPrismaSchema() {
  runCommand(process.execPath, [prismaBin, "db", "push"], "Dong bo Prisma schema");
}

function getUserCount() {
  const result = runCommand(
    process.execPath,
    [
      "-e",
      [
        "const { PrismaClient } = require('@prisma/client');",
        "const prisma = new PrismaClient();",
        "(async () => {",
        "  try {",
        "    const count = await prisma.user.count();",
        "    process.stdout.write(String(count));",
        "  } finally {",
        "    await prisma.$disconnect().catch(() => undefined);",
        "  }",
        "})().catch((error) => {",
        "  console.error(error);",
        "  process.exit(1);",
        "});"
      ].join(" ")
    ],
    "Kiem tra du lieu nguoi dung hien co",
    { stdio: "pipe" }
  );

  return Number(result.stdout.trim() || "0");
}

function seedDatabaseIfNeeded() {
  const userCount = getUserCount();

  if (userCount > 0) {
    console.log(
      `[dev-single-instance] Da co ${userCount} user trong database, bo qua seed du lieu mau`
    );
    return;
  }

  runCommand(npmCommand, ["run", "prisma:seed"], "Nap du lieu mau ban dau");
}

function ensureDemoAccounts() {
  runCommand(
    process.execPath,
    [
      "-e",
      [
        "const bcrypt = require('bcryptjs');",
        "const { PrismaClient, UserRole, UserStatus } = require('@prisma/client');",
        "const prisma = new PrismaClient();",
        "(async () => {",
        "  const passwordHash = await bcrypt.hash('123456', 10);",
        "  const accounts = [",
        "    { email: 'admin@meowmarket.vn', fullName: 'Trần Bảo Châu', phone: '0987654321', avatarUrl: 'BC', role: UserRole.ADMIN },",
        "    { email: 'staff@meowmarket.vn', fullName: 'Ngô Thanh Vy', phone: '0934567890', avatarUrl: 'TV', role: UserRole.STAFF },",
        "    { email: 'user@meowmarket.vn', fullName: 'Nguyễn Minh Anh', phone: '0901234567', avatarUrl: 'MA', role: UserRole.USER }",
        "  ];",
        "  for (const account of accounts) {",
        "    const existed = await prisma.user.findUnique({ where: { email: account.email } });",
        "    if (!existed) {",
        "      await prisma.user.create({",
        "        data: {",
        "          email: account.email,",
        "          fullName: account.fullName,",
        "          phone: account.phone,",
        "          avatarUrl: account.avatarUrl,",
        "          role: account.role,",
        "          status: UserStatus.ACTIVE,",
        "          notificationsEnabled: true,",
        "          passwordHash",
        "        }",
        "      });",
        "    }",
        "  }",
        "  await prisma.$disconnect();",
        "})().catch(async (error) => {",
        "  console.error(error);",
        "  try { await prisma.$disconnect(); } catch {}",
        "  process.exit(1);",
        "});"
      ].join(" ")
    ],
    "Dam bao tai khoan demo admin, staff va user ton tai"
  );
}

function startPrismaStudio() {
  console.log("[dev-single-instance] Khoi dong Prisma Studio tai http://127.0.0.1:5555");

  studioChild = spawn(process.execPath, [prismaBin, "studio", "--port", "5555"], {
    cwd: workspace,
    stdio: "ignore",
    env: process.env
  });

  studioChild.on("exit", (code) => {
    if (code && code !== 0) {
      console.log(`[dev-single-instance] Prisma Studio da dung voi ma: ${code}`);
    }
  });
}

function startDevServer() {
  console.log("[dev-single-instance] Khoi dong MeowMarket tai http://localhost:3000");
  console.log("[dev-single-instance] Khi sua code, Next.js se tu hot reload, khong can chay lai.");
  console.log(
    "[dev-single-instance] Neu gap 404 chunk/layout.css sau khi doi route, hay chay: npm run dev:reset"
  );

  nextChild = spawn(process.execPath, [nextBin, "dev", "-p", "3000"], {
    cwd: workspace,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: "3000",
      __NEXT_DISABLE_MEMORY_WATCHER: "1"
    }
  });

  nextChild.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

function cleanup() {
  if (studioChild && !studioChild.killed) {
    studioChild.kill("SIGTERM");
  }

  if (nextChild && !nextChild.killed) {
    nextChild.kill("SIGTERM");
  }
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

async function main() {
  await ensureDatabaseServer();
  syncPrismaSchema();
  seedDatabaseIfNeeded();
  ensureDemoAccounts();

  if (process.env.MEOWMARKET_SKIP_DEV_START === "1") {
    console.log("[dev-single-instance] Da hoan tat bootstrap database, bo qua khoi dong web");
    return;
  }

  stopWorkspaceNextProcesses();
  stopWorkspacePrismaStudioProcesses();
  stopListeningPorts();
  removeNextCache();
  startPrismaStudio();
  startDevServer();
}

main().catch((error) => {
  console.error(`[dev-single-instance] ${error.message}`);
  process.exit(1);
});
