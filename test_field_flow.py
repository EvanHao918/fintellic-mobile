"""测试字段从后端到前端的完整流程"""
import requests
import json

# 测试每种类型的财报
filing_ids = {
    '10-K': 'YOUR_10K_ID',
    '10-Q': 'YOUR_10Q_ID', 
    '8-K': 'YOUR_8K_ID',
    'S-1': 'YOUR_S1_ID'
}

# 需要先登录获取token
# token = "YOUR_TOKEN"

for filing_type, filing_id in filing_ids.items():
    response = requests.get(
        f"http://localhost:8000/api/v1/filings/{filing_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n{filing_type} 返回的字段:")
        for key in sorted(data.keys()):
            if data[key] is not None:
                print(f"  ✓ {key}")
