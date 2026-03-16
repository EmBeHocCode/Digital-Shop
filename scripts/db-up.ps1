$ErrorActionPreference = "Stop"

$containerName = "meowmarket-postgres"

$existingContainerId = docker ps -aq --filter "name=^${containerName}$" 2>$null

if ($LASTEXITCODE -ne 0) {
  throw "Docker daemon chưa sẵn sàng."
}

if ($existingContainerId) {
  docker start $containerName | Out-Null
} else {
  docker compose up -d postgres
}

docker ps --filter "name=^${containerName}$" --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
