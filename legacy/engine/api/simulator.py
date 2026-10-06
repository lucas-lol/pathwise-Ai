# backend/api/simulator.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
import os

router = APIRouter()

# 使用环境变量获取 Key (Vercel 部署时在 Dashboard 配置)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ChatRequest(BaseModel):
    careerName: str
    category: int
    userChoice: str
    history: list

@router.post("/simulator/chat")
async def chat_with_boss(request: ChatRequest):
    personas = {
        0: "你是 Alex，一位极其严厉、追求完美的技术总监。你说话简短、直击痛点，经常使用技术术语。你对下属的错误零容忍，但也会给出专业的指导。",
        3: "你是 Sarah，一位野心勃勃、结果导向的产品副总裁。你只关心 DAU、转化率和商业价值。你讨厌听借口，喜欢听解决方案。",
    }
    persona = personas.get(request.category, "你是一位严厉的行业高管，对下属要求极高，说话带刺但专业。")
    
    messages = [
        {"role": "system", "content": persona},
        *request.history,
        {"role": "user", "content": f"[当前模拟职业：{request.careerName}] 我选择了：{request.userChoice}"}
    ]
    
    def event_generator():
        stream = client.chat.completions.create(
            model="gpt-4o", # 或 gpt-3.5-turbo
            messages=messages,
            stream=True
        )
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    return StreamingResponse(event_generator(), media_type="text/plain")