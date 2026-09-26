import pandas as pd
import json
from pathlib import Path

def convert_knowledge_excel():
    file_path = Path(__file__).parent / "data" / "知识点.xlsx"
    if not file_path.exists():
        print(f"❌ 找不到文件: {file_path}")
        return

    # 读取 Sheet2，不设表头
    df = pd.read_excel(file_path, sheet_name='Sheet2', header=None)
    
    knowledge_base = []
    
    # 安全读取单元格的函数（防止越界）
    def safe_get(row_idx, col_idx):
        if col_idx < df.shape[1]:
            return df.iloc[row_idx, col_idx]
        return None

    # 1. 自动检测年级所在的列 (扫描第一行 Row 0)
    grade_blocks = []
    for col_idx in range(df.shape[1]):
        val = df.iloc[0, col_idx]
        if pd.notna(val) and ('初' in str(val) or '高' in str(val)):
            grade_blocks.append((col_idx, str(val).strip()))
            
    print(f"🔍 检测到年级块: {grade_blocks}")
    
    # 2. 遍历每个年级块进行提取
    for start_col, grade_name in grade_blocks:
        print(f"🚀 正在处理: {grade_name} (起始列: {start_col})")
        
        # 从第 3 行开始读取数据 (index 2)
        for row_idx in range(2, len(df)):
            # 使用 safe_get 安全读取
            name = safe_get(row_idx, start_col + 1) 
            
            if pd.isna(name) or str(name).strip() == '': 
                continue # 跳过空行
                
            chapter = safe_get(row_idx, start_col + 0)
            domain_raw = safe_get(row_idx, start_col + 3) 
            imp_raw = safe_get(row_idx, start_col + 5)
            diff_raw = safe_get(row_idx, start_col + 6)
            formula = safe_get(row_idx, start_col + 7) # 这里之前越界了
            
            # 智能拆分 Domain
            domain = str(domain_raw) if pd.notna(domain_raw) else ""
            topic = ""
            if '-' in domain:
                parts = domain.split('-', 1)
                domain = parts[0].strip()
                topic = parts[1].strip()
            elif '—' in domain:
                parts = domain.split('—', 1)
                domain = parts[0].strip()
                topic = parts[1].strip()
                
            item = {
                "id": f"{grade_name}_{chapter}_{name}".replace(" ", "_"),
                "grade": grade_name,
                "chapter": str(chapter) if pd.notna(chapter) else "",
                "name": str(name),
                "domain": domain,
                "topic": topic,
                "importance": str(imp_raw).count('*') if pd.notna(imp_raw) else 0,
                "difficulty": str(diff_raw).count('*') if pd.notna(diff_raw) else 0,
                "formula": str(formula) if pd.notna(formula) else ""
            }
            knowledge_base.append(item)

    # 3. 保存为 JSON
    output_file = Path(__file__).parent / "data" / "knowledge.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(knowledge_base, f, ensure_ascii=False, indent=2)
        
    print(f"✅ 成功转换 {len(knowledge_base)} 个知识点到 {output_file}")

if __name__ == "__main__":
    convert_knowledge_excel()