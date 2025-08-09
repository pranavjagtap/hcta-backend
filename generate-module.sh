#!/usr/bin/env bash

MOD="payslip"
PATH_BASE="src"
FILES=(
  "models/${MOD}.ts"
  "validators/${MOD}.validator.ts"
  "types/${MOD}.types.ts"
  "services/${MOD}.service.ts"
  "controllers/${MOD}.controller.ts"
  "api/${MOD}.route.ts"
  "utils/pdf.ts"
)

echo "Creating $MOD module files..."
for file in "${FILES[@]}"; do
  dir="${PATH_BASE}/$(dirname "$file")"
  mkdir -p "$dir"
  touch "${PATH_BASE}/${file}"
  echo "// TODO: Implement $file" > "${PATH_BASE}/${file}"
  echo "  - Created: ${PATH_BASE}/${file}"
done