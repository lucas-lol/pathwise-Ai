from models.base import engine, Base
# 只需要导入你确定存在的核心表，触发 SQLAlchemy 的元数据注册
from models.tables import User, StudentProfile, StudentState 

def init_database():
    print("🔍 正在检查并创建数据库表...")
    try:
        # create_all 会自动检查表是否存在，不存在则创建，存在则跳过（不会删数据）
        Base.metadata.create_all(bind=engine)
        print("✅ 数据库表创建/更新成功！")
        print("📁 数据库文件位于: backend/database.db (或你配置的名称)")
    except Exception as e:
        print(f"❌ 创建数据库表时出错: {e}")

if __name__ == "__main__":
    init_database()