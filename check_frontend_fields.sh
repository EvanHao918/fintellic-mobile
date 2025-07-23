#!/bin/bash
echo "=== 检查前端组件中使用的财报字段 ==="
echo

echo "10-K (Annual10KDetail.tsx) 使用的字段:"
echo "----------------------------------------"
grep -oE '(filing\.|data\.)[a-zA-Z_]+' src/components/filing-details/Annual10KDetail.tsx | sort | uniq | sed 's/filing\./  - /g' | sed 's/data\./  - /g'

echo
echo "10-Q (Quarterly10QDetail.tsx) 使用的字段:"
echo "----------------------------------------"
grep -oE '(filing\.|data\.)[a-zA-Z_]+' src/components/filing-details/Quarterly10QDetail.tsx | sort | uniq | sed 's/filing\./  - /g' | sed 's/data\./  - /g'

echo
echo "8-K (Current8KDetail.tsx) 使用的字段:"
echo "----------------------------------------"
grep -oE '(filing\.|data\.)[a-zA-Z_]+' src/components/filing-details/Current8KDetail.tsx | sort | uniq | sed 's/filing\./  - /g' | sed 's/data\./  - /g'

echo
echo "S-1 (IPOS1Detail.tsx) 使用的字段:"
echo "----------------------------------------"
grep -oE '(filing\.|data\.)[a-zA-Z_]+' src/components/filing-details/IPOS1Detail.tsx | sort | uniq | sed 's/filing\./  - /g' | sed 's/data\./  - /g'
