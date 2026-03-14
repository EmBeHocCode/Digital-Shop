const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const workspace = process.cwd();
const ports = [3000, 3001, 3002, 5555];
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function runPowerShell(script) {
  return spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
    {
      cwd: workspace,
      encoding: "utf8",
      stdio: "pipe"
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
    console.log(`[dev-reset] Da dung process giu port: ${result.stdout.trim()}`);
  }
}

function stopWorkspaceNodeProcesses() {
  const escapedWorkspace = workspace.replace(/\\/g, "\\\\");
  const result = runPowerShell(`
    $workspace = "${escapedWorkspace}"
    $processIds = Get-CimInstance Win32_Process |
      Where-Object {
        $_.Name -eq "node.exe" -and
        $_.CommandLine -like "*$workspace*"
      } |
      Select-Object -ExpandProperty ProcessId -Unique
    if ($processIds) {
      Stop-Process -Id $processIds -Force -ErrorAction SilentlyContinue
      $processIds -join ","
    }
  `);

  if (result.stdout.trim()) {
    console.log(`[dev-reset] Da dung node process cua project: ${result.stdout.trim()}`);
  }
}

function removePath(targetPath, label) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
    console.log(`[dev-reset] Da xoa ${label}`);
  }
}

function main() {
  stopWorkspaceNodeProcesses();
  stopListeningPorts();
  removePath(path.join(workspace, ".next"), ".next");
  removePath(path.join(workspace, ".turbo"), ".turbo");
  console.log("[dev-reset] Moi truong dev da duoc don sach.");
  console.log("[dev-reset] Chay lai: npm run dev");
}

main();
