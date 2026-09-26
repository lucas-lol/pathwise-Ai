import re
import json
from pathlib import Path

def parse_careers_md(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    careers = []
    current_category = "未分类"
    current_career = None

    # 按行解析
    for line in content.split('\n'):
        line = line.strip()
        if not line: continue

        # 1. 匹配大标题：##  科技 Technology（1–10）
        if line.startswith('## '):
            # 提取分类名，去掉序号和括号内容
            match = re.match(r'##\s+[①③④⑤⑥⑦⑨⑩]?\s*(.*?)（', line)
            if match:
                current_category = match.group(1).strip()
            else:
                current_category = line.replace('## ', '').strip()

        # 2. 匹配小标题：### 1. 软件工程师 Software Engineer
        elif line.startswith('### '):
            if current_career:
                careers.append(current_career)
            
            match = re.match(r'###\s+\d+\.\s+(.*)', line)
            if match:
                name_full = match.group(1).strip()
                parts = name_full.split(' ', 1)
                cn_name = parts[0]
                en_name = parts[1] if len(parts) > 1 else cn_name
                
                # 生成 ID：使用英文小写加下划线
                career_id = en_name.lower().replace(' ', '_') if en_name != cn_name else f"career_{len(careers)+1}"
                
                current_career = {
                    "id": career_id,
                    "name_cn": cn_name,
                    "name_en": en_name,
                    "category": current_category,
                    "required_skills": [],
                    "preferred_knowledge": [],
                    "related_subjects": [],
                    "interest_tags": [],
                    "goal_tags": [],
                    "career_path": ""
                }

        # 3. 匹配属性：- **required_skills**: Analytical Reasoning, ...
        elif line.startswith('- **') and current_career:
            match = re.match(r'- \*\*(.*?)\*\*:\s*(.*)', line)
            if match:
                key = match.group(1).strip()
                value = match.group(2).strip()
                
                # 将逗号分隔的字符串转为列表
                if key in ['required_skills', 'preferred_knowledge', 'related_subjects', 'interest_tags', 'goal_tags']:
                    current_career[key] = [v.strip() for v in value.split(',')]
                else:
                    current_career[key] = value

    # 别忘了最后一个职业
    if current_career:
        careers.append(current_career)

    return careers

# 执行转换
if __name__ == "__main__":
    # 确保你的 md 文件放在 backend/data/ 目录下
    md_file = Path(__file__).parent / "data" / "职业介绍.md" 
    
    if md_file.exists():
        careers_data = parse_careers_md(md_file)
        output_file = Path(__file__).parent / "data" / "careers.json"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(careers_data, f, ensure_ascii=False, indent=2)
            
        print(f"✅ 成功转换 {len(careers_data)} 个职业到 {output_file}")
    else:
        print(f"❌ 找不到文件: {md_file}")