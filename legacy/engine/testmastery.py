import sys
import os

# 确保能导入 backend 的模块
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from api.assessment import calculate_alpha, update_mastery

def test_mastery_algorithm():
    print("=== P0-05 掌握度算法验证 ===\n")
    
    # 测试场景 1：做对简单题 (difficulty=1)
    alpha_easy = calculate_alpha(1)
    m_new = update_mastery(0.5, 1.0, alpha_easy) # 旧掌握度 0.5，答对 (e=1.0)
    print(f"场景 1: 做对简单题 (alpha={alpha_easy:.2f}) -> 掌握度从 0.50 升至 {m_new:.2f}")
    
    # 测试场景 2：做对困难题 (difficulty=3)
    alpha_hard = calculate_alpha(3)
    m_new = update_mastery(0.5, 1.0, alpha_hard)
    print(f"场景 2: 做对困难题 (alpha={alpha_hard:.2f}) -> 掌握度从 0.50 升至 {m_new:.2f}  <-- 困难题提升更多！")
    
    # 测试场景 3：做错困难题 (e=0)
    m_new = update_mastery(0.8, 0.0, alpha_hard) # 旧掌握度 0.8，答错
    print(f"场景 3: 做错困难题 (alpha={alpha_hard:.2f}) -> 掌握度从 0.80 降至 {m_new:.2f}  <-- 做错会下降！")
    
    # 测试场景 4：边界情况 (掌握度已达 1.0)
    m_new = update_mastery(1.0, 1.0, alpha_hard)
    print(f"场景 4: 满分再做对 -> 掌握度保持 {m_new:.2f} (不应超过 1.0)")

    print("\n=== 验证结论 ===")
    print("如果困难题的提升幅度 > 简单题，且做错会下降，说明算法逻辑正确。")
    print("P0-05 要求：统一采用此 EMA 公式，并在代码中添加注释锁死。")

if __name__ == "__main__":
    test_mastery_algorithm()