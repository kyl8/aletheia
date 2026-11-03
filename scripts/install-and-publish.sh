#!/usr/bin/env bash
# Run this script INSIDE a GitHub Codespace opened on kyl8/aletheia main.
# It replaces legacy Astro+React sources with the extracted Astro+Svelte project.
# A failed test, check or build aborts before any git push.
set -euo pipefail

if ! command -v git >/dev/null || ! command -v npm >/dev/null; then
  echo 'Precisa executar em um Codespace com Git e Node.js.' >&2
  exit 1
fi

REPO="$(git rev-parse --show-toplevel 2>/dev/null || true)"
SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -z "$REPO" ] || [ ! -d "$REPO/.git" ]; then
  echo 'Abra o terminal na pasta do repositório dentro do GitHub Codespaces.' >&2
  exit 1
fi
if [ "$REPO" = "$SOURCE" ]; then
  echo 'Esta atualização deve ser executada a partir de uma cópia ZIP extraída fora do repositório.' >&2
  exit 1
fi
REMOTE="$(git -C "$REPO" remote get-url origin)"
if [[ "$REMOTE" != *"kyl8/aletheia"* && "$REMOTE" != *"kyl8/aletheia.git"* ]]; then
  echo "Repositório inesperado: $REMOTE" >&2
  exit 1
fi
BRANCH="$(git -C "$REPO" branch --show-current)"
if [ "$BRANCH" != main ]; then
  echo "Acesse main antes: git switch main (atual: $BRANCH)" >&2
  exit 1
fi

echo 'Substituindo arquivos da versão antiga (histórico preservado no Git)...'
rm -rf "$REPO/src" "$REPO/public" "$REPO/tests" "$REPO/scripts"
rm -f "$REPO/bun.lock" "$REPO/package-lock.json"
cp -a "$SOURCE/." "$REPO/"
rm -f "$REPO/aletheia-svelte-v2.zip"
cd "$REPO"

echo 'Instalando dependências...'
npm install --no-audit --no-fund

echo 'Rodando testes unitários...'
npm test

echo 'Verificando Svelte/Astro...'
npm run check

echo 'Compilando site estático...'
npm run build

echo 'Testes e build aprovados. Gerando commit e push para main...'
git add -A
if git diff --cached --quiet; then
  echo 'Sem mudanças novas para enviar.'
else
  git commit -m 'feat: migrate Aletheia to Svelte 5 and add browser converters'
  git push origin main
fi

echo 'Concluído. Acompanhe GitHub Actions > Build and deploy Aletheia.'
