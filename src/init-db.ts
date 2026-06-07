/**
 * 数据库初始化脚本
 * 用于创建测试用户数据
 */
import KvCache from './kv_cache.ts'

/**
 * 初始化用户数据库
 * 添加测试用户数据到 Deno KV 数据库
 */
async function initDatabase() {
    // 清空所有数据
    const kv = await KvCache._getKv();
    const entries = kv.list({ prefix: [] });
    for await (const entry of entries) {
        await kv.delete(entry.key);
        console.log(`已删除键: ${entry.key}`);
    }

    console.log('数据库已清空!');

    // 测试用户数据
    const testUsers = {
        '9067bdcd809648626457fc7cc40825bbbf210e9d': {
            username: 'teacher1',
            password: 'password123',
            role: 'teacher',
            name: '张老师'
        },
        '444874d5690e41b38be872676c1aa3b7493bf4e7': {
            username: 'teacher2',
            password: 'password456',
            role: 'teacher',
            name: '李老师'
        },
        '12fae5d8b4f01762e0035050112146101247df66': {
            username: 'admindm123',
            password: 'admin123',
            role: 'admin',
            name: '管理员'
        }
};
    
    // 添加测试用户到数据库
    for (const [userId, user] of Object.entries(testUsers)) {
        const success = await KvCache.set(
            {
                key: userId, 
                value: JSON.stringify({
                    username: user.username,
                    password: user.password,
                    role: user.role,
                    name: user.name
                }),
                prefix: 'ud_'
            },
            () => true,
            (err: Error) => {
                console.error(err.message)
                return false
            }
        );
        if (success) {
            console.log(`已添加用户: ${user.username} (ID: ${userId})`);
        } else {
            console.error(`添加用户失败: ${user.username} (ID: ${userId})`);
        }
    }
    
    console.log('数据库初始化完成!');
}

// 执行初始化
initDatabase();

//deno run --unstable-kv --allow-write init-db.ts