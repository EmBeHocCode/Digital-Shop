$ErrorActionPreference = "Stop"

$containerName = "meowmarket-postgres"

$existingContainerId = docker ps -aq --filter "name=^${containerName}$" 2>$null

if ($LASTEXITCODE -ne 0) {
  throw "Docker daemon chưa sẵn sàng."
}

if ($existingContainerId) {
  docker stop $containerName | Out-Null
}

docker ps --filter "name=^${containerName}$" --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
