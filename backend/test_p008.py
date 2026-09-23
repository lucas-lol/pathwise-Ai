import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

def test_p008_funnel_guard():
    print("=== P0-08 防跳跃拦截测试 ===\n")
    
    # 1. 注册一个"裸奔"的学生（只注册，不填画像）
    print("1. 正在注册一个新学生...")
    req = urllib.request.Request(
        f"{BASE_URL}/api/users", 
        data=json.dumps({"name": "插队测试学生"}).encode(), 
        headers={"Content-Type": "application/json"}
    )
    try:
        res = urllib.request.urlopen(req)
        user = json.loads(res.read())
        uid = user.get("id")
        print(f"   ✅ 注册成功，学生 ID: {uid}\n")
    except Exception as e:
        print(f"   ❌ 注册失败: {e}")
        return

    # 2. 让他直接去考试（这就是"非法操作/插队"）
    print("2. 尝试让该学生直接进行 Assessment (非法插队)...")
    exam_data = {
        "subject_id": "math",
        "answers": [{"question_id": "q-math-j1-linear-001", "answer": "B"}]
    }
    req = urllib.request.Request(
        f"{BASE_URL}/api/students/{uid}/assessment", 
        data=json.dumps(exam_data).encode(), 
        headers={"Content-Type": "application/json"}
    )
    
    # 3. 观察结果
    try:
        res = urllib.request.urlopen(req)
        print("   ❌ 测试失败：系统竟然让他通过了！(P0-08 守卫未生效)")
    except urllib.error.HTTPError as e:
        if e.code == 400:
            print(f"   ✅ 测试成功！系统拦截了插队行为！")
            print(f"   错误码: {e.code}")
            print(f"   拦截信息: {e.read().decode()}")
        else:
            print(f"   ⚠️ 系统报错了，但不是 400: {e.code}")

if __name__ == "__main__":
    test_p008_funnel_guard()