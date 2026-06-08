import KvCache from './kv_cache.ts'
import Utils from './utils.ts'
import User from './user.ts'


const Bind = {
    async generateClassroomToken(classroomId: string) {
        const token = Utils.generateToken();
        return await KvCache.set(
            {prefix: 'gct_', key: classroomId, value: {token, channel: 'classroom_bind'}, ttl: 300000},
            //ttl 5分钟
            () => { // 成功回调
            return Utils.RJson({token,  ttl: 300000}, 200, 'gct: kv.set', true)
        }, (err) => {
            return Utils.RJson({}, 500, err.message, false);
        });
    },

    async teacherBind({teacherId, teacherToken, classroomId, classroomToken}: {teacherId: string, teacherToken: string, classroomId: string, classroomToken: string}) {        
        //检查token
        if (!await User.checkTeacherToken(teacherId,teacherToken))
            return Utils.RJson({e:'tb2'}, 400, 'Teacher token failed', false)

        // 检查班级bind临时token
        const cacheClassroomValue = await KvCache.get<{token: string, channel: string}>({prefix: 'gct_', key: classroomId})
        if (!cacheClassroomValue
            || cacheClassroomValue.channel !== 'classroom_bind'//检测渠道类型
            || cacheClassroomValue.token !== classroomToken) {//匹配
            return Utils.RJson({e:'tb3'}, 400, 'Classroom token failed', false);
        }

        const account = await User.getUserAccount(teacherId)
        if (!account) {
            return Utils.RJson({e:'tb4'}, 404, 'UD not found', false);
        }

        account.userData ??= {};//如果存在
        account.userData.bindClassroom ??= [];

        // 检查班级是否已绑定
        if (account.userData.bindClassroom.includes(classroomId)) {
            return Utils.RJson({e:'tb5'}, 400, 'Classroom already bound', false);
        }
        account.userData.bindClassroom.push(classroomId)
        
        // 写入
        return await KvCache.set(
            {prefix: 'ud_', key: teacherId, value: JSON.stringify(account)},
        () => { // 成功回调
            return Utils.RJson({
                classroomId,
                bindClassroom: account.userData.bindClassroom,
            }, 200, 'Action success', true)
        }, (err) => {
            return Utils.RJson({}, 500, err.message, false);
        });
    },

    async teacherUnbind({teacherId, classroomId, teacherToken}: {teacherId: string, classroomId: string, teacherToken: string}) {
        //检查token
        if (!await User.checkTeacherToken(teacherId,teacherToken))
            return Utils.RJson({e:'tub2'}, 400, 'Teacher token failed', false)

        const account = await User.getUserAccount(teacherId);
        if (!account.userData.bindClassroom || !account.userData.bindClassroom.includes(classroomId)) {
            return Utils.RJson({e:'tub3'}, 400, 'Classroom not bound', false);
        }
        
        account.userData ??= {};//如果存在
        account.userData.bindClassroom ??= [];

        // 解绑班级
        account.userData.bindClassroom = account.userData.bindClassroom.filter((item: string) => item !== classroomId);
        
        // 写入
        return await KvCache.set(
            {prefix: 'ud_', key: teacherId, value: JSON.stringify(account)},
        () => { // 成功回调
            return Utils.RJson({
                classroomId
            }, 200, 'Action success', true)
        }, (err) => {
            return Utils.RJson({}, 500, err.message, false);
        });
    },

}
export default Bind
