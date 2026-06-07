import KvCache from './kv_cache.ts'

const User = {
    async getUserAccount(userId: string) {
        //读取
        const user = await KvCache.get<string>({prefix: 'ud_', key: userId})
        if (!user) {
            return null;
        }
        const userAccount = JSON.parse(user)
        return userAccount
    },
    async checkTeacherToken(teacherId: string, teacherToken: string){
        // 检查老师token
        const cacheTeacherValue = await KvCache.get({prefix: 'lr_', key: teacherId})
        if (!!cacheTeacherValue && cacheTeacherValue === teacherToken) {
            return true;
        }
        return false;
    },

}
export default User
