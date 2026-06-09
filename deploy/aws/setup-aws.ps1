#Requires -Version 5.1
<#
.SYNOPSIS
  Deploiement SOFISMART production sur AWS (eu-west-3)

.EXAMPLE
  .\deploy\aws\setup-aws.ps1 -Phase all
  .\deploy\aws\setup-aws.ps1 -Phase infra
  .\deploy\aws\setup-aws.ps1 -Phase app
#>
param(
  [ValidateSet("all", "infra", "app", "status")]
  [string]$Phase = "all",
  [string]$Region = "eu-west-3",
  [string]$StackName = "sofismart-prod",
  [string]$AppUrl = "http://localhost",
  [string]$AdminEmail = "admin@sofismart.com",
  [string]$AdminPassword = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

function Refresh-Path {
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
}
Refresh-Path

function Require-Aws {
  if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "AWS CLI introuvable. Installez : winget install Amazon.AWSCLI" -ForegroundColor Red
    exit 1
  }
  try {
    $id = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "AWS connecte : compte $($id.Account) / $($id.Arn)" -ForegroundColor Green
    return $id.Account
  } catch {
    Write-Host "AWS non configure. Executez : aws configure" -ForegroundColor Red
    Write-Host "  Access Key ID + Secret + region $Region" -ForegroundColor Yellow
    exit 1
  }
}

function New-SecurePassword([int]$Length = 24) {
  $chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%*"
  -join ((1..$Length) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
}

function Get-DefaultVpcInfo {
  $vpc = aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --region $Region `
    --query "Vpcs[0].VpcId" --output text
  if (-not $vpc -or $vpc -eq "None") {
    throw "Aucun VPC par defaut. Creez un VPC ou passez VpcId manuellement."
  }
  $subnets = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpc" --region $Region `
    --query "Subnets[*].SubnetId" --output text
  $subnetList = $subnets -split "\s+" | Where-Object { $_ }
  if ($subnetList.Count -lt 2) { throw "Il faut au moins 2 subnets dans le VPC $vpc" }
  return @{ VpcId = $vpc; Subnets = $subnetList }
}

function Deploy-Infrastructure($AccountId) {
  Write-Host "`n=== Phase INFRA : CloudFormation ===" -ForegroundColor Cyan

  $vpcInfo = Get-DefaultVpcInfo
  $dbPass = New-SecurePassword 20
  $adminPass = if ($AdminPassword) { $AdminPassword } else { New-SecurePassword 16 }
  $authSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

  $credFile = Join-Path $env:TEMP "sofismart-aws-creds.json"
  @{
    DBPassword       = $dbPass
    AuthSecret       = $authSecret
    AdminPassword    = $adminPass
    AdminEmail       = $AdminEmail
    CreatedAt        = (Get-Date).ToString("o")
  } | ConvertTo-Json | Set-Content $credFile -Encoding UTF8
  Write-Host "Identifiants generes sauvegardes dans : $credFile" -ForegroundColor Yellow
  Write-Host "  Admin : $AdminEmail / $adminPass" -ForegroundColor DarkYellow

  $overrides = @(
    "VpcId=$($vpcInfo.VpcId)",
    "DBPassword=$dbPass",
    "AuthSecret=$authSecret",
    "SeedAdminPassword=$adminPass",
    "SeedAdminEmail=$AdminEmail",
    "AppUrl=$AppUrl",
    "S3PublicBaseUrl=https://sofismart-prod-uploads-$AccountId.s3.$Region.amazonaws.com",
    "DesiredCount=0"
  )
  foreach ($s in $vpcInfo.Subnets) { $overrides += "PublicSubnetIds=$s" }

  $template = Join-Path $PSScriptRoot "cloudformation\sofismart-prod.yaml"
  & aws cloudformation deploy `
    --template-file $template `
    --stack-name $StackName `
    --region $Region `
    --capabilities CAPABILITY_NAMED_IAM `
    --parameter-overrides @overrides
  if ($LASTEXITCODE -ne 0) { throw "Echec CloudFormation" }

  Write-Host "Stack $StackName deploye (RDS ~5-10 min la premiere fois)..." -ForegroundColor Green
  Write-Host "Attente fin creation RDS..." -ForegroundColor Yellow
  aws cloudformation wait stack-create-complete --stack-name $StackName --region $Region 2>$null
  aws cloudformation wait stack-update-complete --stack-name $StackName --region $Region 2>$null

  $outputs = aws cloudformation describe-stacks --stack-name $StackName --region $Region `
    --query "Stacks[0].Outputs" --output json | ConvertFrom-Json

  foreach ($o in $outputs) {
    Write-Host "  $($o.OutputKey) = $($o.OutputValue)" -ForegroundColor Gray
  }

  $alb = ($outputs | Where-Object { $_.OutputKey -eq "LoadBalancerDNS" }).OutputValue
  if ($alb) {
    $appUrl = "http://$alb"
    Write-Host "Mise a jour APP_URL dans Secrets Manager : $appUrl" -ForegroundColor Yellow
    $secret = aws secretsmanager get-secret-value --secret-id sofismart/prod --region $Region `
      --query SecretString --output text | ConvertFrom-Json
    $secret.APP_URL = $appUrl
    $secret.NEXTAUTH_URL = $appUrl
    aws secretsmanager put-secret-value --secret-id sofismart/prod --region $Region `
      --secret-string ($secret | ConvertTo-Json -Compress) | Out-Null
  }

  return $outputs
}

function Deploy-Application($AccountId) {
  Write-Host "`n=== Phase APP : Docker build + push ECR ===" -ForegroundColor Cyan

  $ecrUri = "$AccountId.dkr.ecr.$Region.amazonaws.com/sofismart"

  aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin `
    "$AccountId.dkr.ecr.$Region.amazonaws.com"
  if ($LASTEXITCODE -ne 0) { throw "Echec login ECR — Docker Desktop demarre ?" }

  Write-Host "Build image Docker (5-10 min)..." -ForegroundColor Yellow
  docker build -t sofismart:latest .
  if ($LASTEXITCODE -ne 0) { throw "Echec docker build" }

  docker tag sofismart:latest "${ecrUri}:latest"
  docker push "${ecrUri}:latest"
  if ($LASTEXITCODE -ne 0) { throw "Echec docker push" }

  Write-Host "Image poussee : ${ecrUri}:latest" -ForegroundColor Green

  Write-Host "`nDemarrage service ECS (DesiredCount=1)..." -ForegroundColor Yellow
  aws ecs update-service --cluster sofismart-prod --service sofismart-app `
    --desired-count 1 --force-new-deployment --region $Region | Out-Null

  Write-Host "Attente stabilisation service (2-5 min)..." -ForegroundColor Yellow
  aws ecs wait services-stable --cluster sofismart-prod --services sofismart-app --region $Region

  $alb = aws cloudformation describe-stacks --stack-name $StackName --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDNS'].OutputValue" --output text

  Write-Host "`n========================================" -ForegroundColor Green
  Write-Host " SOFISMART PRODUCTION DEPLOYE" -ForegroundColor Green
  Write-Host " URL : http://$alb" -ForegroundColor Green
  Write-Host " Health : http://$alb/api/health" -ForegroundColor Green
  Write-Host "========================================" -ForegroundColor Green
  Write-Host " Login : $AdminEmail" -ForegroundColor Green
  Write-Host " (mot de passe dans $env:TEMP\sofismart-aws-creds.json)" -ForegroundColor Green
  Write-Host "========================================" -ForegroundColor Green
}

function Show-Status {
  $AccountId = Require-Aws
  aws cloudformation describe-stacks --stack-name $StackName --region $Region `
    --query "Stacks[0].{Status:StackStatus,Outputs:Outputs}" --output table 2>$null
  aws ecs describe-services --cluster sofismart-prod --services sofismart-app --region $Region `
    --query "services[0].{Status:status,Running:runningCount,Desired:desiredCount}" --output table 2>$null
}

# --- Main ---
$AccountId = Require-Aws

switch ($Phase) {
  "infra" { Deploy-Infrastructure $AccountId }
  "app"   { Deploy-Application $AccountId }
  "status" { Show-Status }
  "all" {
    Deploy-Infrastructure $AccountId
    Deploy-Application $AccountId
  }
}
