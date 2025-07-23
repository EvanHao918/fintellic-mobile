"""
验证前后端字段映射的一致性
"""

# 数据库定义的字段
DB_FIELDS = {
    '10-K': {
        'auditor_opinion', 'business_segments', 'growth_drivers',
        'management_outlook', 'market_impact_10k', 'risk_summary',
        'strategic_adjustments', 'three_year_financials'
    },
    '10-Q': {
        'beat_miss_analysis', 'cost_structure', 'expectations_comparison',
        'growth_decline_analysis', 'guidance_update', 'management_tone_analysis',
        'market_impact_10q'
    },
    '8-K': {
        'event_nature_analysis', 'event_timeline', 'item_type',
        'items', 'key_considerations', 'market_impact_analysis'
    },
    'S-1': {
        'company_overview', 'competitive_moat_analysis', 'financial_summary',
        'growth_path_analysis', 'ipo_details', 'risk_categories'
    }
}

# 前端使用的字段（从您的输出中提取）
FRONTEND_FIELDS = {
    '10-K': {
        'auditor_opinion', 'business_segments', 'growth_drivers',
        'management_outlook', 'risk_summary', 'strategic_adjustments',
        'three_year_financials'
        # 注意：缺少 market_impact_10k
    },
    '10-Q': {
        'beat_miss_analysis', 'cost_structure', 'expectations_comparison',
        'growth_decline_analysis', 'guidance_update', 'management_tone_analysis'
        # 注意：缺少 market_impact_10q
    },
    '8-K': {
        'event_nature_analysis', 'event_timeline', 'item_type',
        'items', 'key_considerations', 'market_impact_analysis',
        'event_summary', 'event_type'  # 额外的字段
    },
    'S-1': {
        'company_overview', 'competitive_moat_analysis', 'financial_summary',
        'growth_path_analysis', 'ipo_details', 'risk_categories',
        'business_description'  # 可能是 company_overview 的别名
    }
}

print("=== Fintellic 字段一致性验证报告 ===\n")

for filing_type in ['10-K', '10-Q', '8-K', 'S-1']:
    print(f"\n{filing_type} 财报字段分析:")
    print("-" * 40)
    
    db_fields = DB_FIELDS[filing_type]
    fe_fields = FRONTEND_FIELDS[filing_type]
    
    # 数据库有但前端没用的
    missing_in_frontend = db_fields - fe_fields
    if missing_in_frontend:
        print(f"❌ 前端缺失的字段:")
        for field in missing_in_frontend:
            print(f"   - {field}")
    
    # 前端用了但数据库没有的
    extra_in_frontend = fe_fields - db_fields
    if extra_in_frontend:
        print(f"⚠️  前端额外的字段:")
        for field in extra_in_frontend:
            print(f"   - {field}")
    
    # 完全匹配的
    matched = db_fields & fe_fields
    print(f"✅ 匹配的字段: {len(matched)}/{len(db_fields)}")

print("\n\n🔧 建议的修复方案:")
print("-" * 40)
print("1. 10-K和10-Q：在前端组件中添加 market_impact_10k/10q 的展示")
print("2. 8-K：检查 event_summary 和 event_type 是否应该映射到其他字段")
print("3. S-1：确认 business_description 是否应该使用 company_overview")
print("\n4. 创建字段映射文档，明确定义:")
print("   - 数据库字段名")
print("   - API响应字段名")
print("   - 前端显示字段名")
