import json
from pathlib import Path
from fastapi import HTTPException

# 1. 读取 engine_params.json 中的漏斗顺序 (单一事实来源)
data_dir = Path(__file__).resolve().parents[1] / "data"
with open(data_dir / "engine_params.json", "r", encoding="utf-8") as f:
    params = json.load(f)

FUNNEL_ORDER = params.get("funnel", [])

def advance_funnel(state: dict, target_step: str) -> dict:
    """
    P0-08: 统一漏斗状态机。
    规则：必须严格按照 engine_params.json 定义的顺序推进，禁止跳跃。
    """
    # 监控摄像头：打印调用信息
    print(f"🚨 [FUNNEL GUARD] 被调用！目标: {target_step}, 当前 funnel 状态: {state.get('funnel')}")
    
    if target_step not in FUNNEL_ORDER:
        raise ValueError(f"非法的漏斗阶段: {target_step}")
    
    target_index = FUNNEL_ORDER.index(target_step)
    
    # 初始化漏斗字典
    if "funnel" not in state:
        state["funnel"] = {}
        
    # 如果已经完成，直接返回
    if state["funnel"].get(target_step, False):
        return state
        
    # 【核心守卫】：检查前置条件。如果不是第一步，前一步必须已完成。
    if target_index > 0:
        prev_step = FUNNEL_ORDER[target_index - 1]
        if not state["funnel"].get(prev_step, False):
            raise HTTPException(
                status_code=400, 
                detail=f"无法推进到 '{target_step}'，因为前置阶段 '{prev_step}' 尚未完成。"
            )
            
    # 推进状态
    state["funnel"][target_step] = True
    return state