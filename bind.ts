import KvCache, { CACHE_TTL } from './kv_cache.ts'
import Utils from './utils.ts'


const Bind = {
    async generateClassroomToken(classroomId: string) {
        const token = Utils.generateToken();
        return await KvCache.set(
            {prefix: 'gct_', key: classroomId, value: {token, channel: 'classroom_bind'}},
        () => { // 成功回调
            return Utils.RJson({token,  ttl: CACHE_TTL}, 200, 'gct: kv.set', true)
        }, (err) => {
            return Utils.RJson({}, 500, err.message, false);
        });
    },

    async teacherBind({teacherId, teacherToken, classroomId, classroomToken}: {teacherId: string, teacherToken: string, classroomId: string, classroomToken: string}) {
        if (!teacherId || !teacherToken || !classroomId || !classroomToken) {
            return Utils.RJson({}, 400, 'Request failed', false);
        }
        
        // 检查老师token
        const cacheTeacherValue = await KvCache.get({prefix: 'lr_', key: teacherId})
        if (!cacheTeacherValue || cacheTeacherValue !== teacherToken) {
            return Utils.RJson({}, 400, 'Teacher token failed', false);
        }
        
        // 检查班级bind临时token
        const cacheClassroomValue = await KvCache.get<{token: string, channel: string}>({prefix: 'gct_', key: classroomId})
        if (!cacheClassroomValue
            || cacheClassroomValue.channel !== 'classroom_bind'//检测渠道类型
            || cacheClassroomValue.token !== classroomToken) {//匹配
            return Utils.RJson({}, 400, 'Classroom token failed', false);
        }

        //读取
        const user = await KvCache.get<string>({prefix: 'ud_', key: teacherId})
        if (!user) {
            return Utils.RJson({}, 404, 'Teacher not found', false);
        }
        const userData = JSON.parse(user)
        userData.bindClassroom = userData.bindClassroom || []

        // 检查班级是否已绑定
        if (userData.bindClassroom.includes(classroomId)) {
            return Utils.RJson({}, 400, 'Classroom already bound', false);
        }
        userData.bindClassroom.push(classroomId)
        

        // 写入
        return await KvCache.set(
            {prefix: 'ud_', key: teacherId, value: JSON.stringify(userData)},
        () => { // 成功回调
            return Utils.RJson({
                classroomId,
                bindClassroom: userData.bindClassroom,
            }, 200, 'Action success', true)
        }, (err) => {
            return Utils.RJson({}, 500, err.message, false);
        });
    },
}
export default Bind
