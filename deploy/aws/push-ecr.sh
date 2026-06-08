#!/usr/bin/env bash
# Build et push de l'image Docker vers Amazon ECR
# Usage : ./deploy/aws/push-ecr.sh eu-west-3 sofismart
set -euo pipefail

REGION="${1:-eu-west-3}"
REPO="${2:-sofismart}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO}"

echo ">> Login ECR"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo ">> Create repository (if missing)"
aws ecr describe-repositories --repository-names "$REPO" --region "$REGION" 2>/dev/null \
  || aws ecr create-repository --repository-name "$REPO" --region "$REGION"

echo ">> Build"
docker build -t "${REPO}:latest" .

echo ">> Tag & push"
docker tag "${REPO}:latest" "${ECR_URI}:latest"
docker push "${ECR_URI}:latest"

echo ">> Image pushed: ${ECR_URI}:latest"
