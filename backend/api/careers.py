from fastapi import APIRouter
import json
from pathlib import Path

router = APIRouter()

@router.get("/careers")
def get_all_careers():
    print("🔍 [后端日志] 收到获取职业列表的请求")
    try:
        # 动态获取 data 目录的绝对路径
        data_dir = Path(__file__).resolve().parents[1] / "data"
        json_path = data_dir / "careers.json"
        
        print(f"📂 [后端日志] 尝试读取文件: {json_path}")
        
        # 1. 检查文件是否存在
        if not json_path.exists():
            print("❌ [后端日志] 文件不存在！")
            return {"error": "职业数据文件 (careers.json) 未找到。请先运行 convert_careers.py"}
            
        # 2. 读取文件
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        print(f"✅ [后端日志] 成功读取 {len(data)} 个职业数据")
        return data
        
    except Exception as e:
        print(f"❌ [后端日志] 读取职业数据时发生严重错误: {e}")
        return {"error": f"服务器内部错误: {str(e)}"}