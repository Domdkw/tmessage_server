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
            return Utils.RJson({e:'tb1'}, 400, 'Request failed', false);
        }
        
        //检查token
        if (!await this._checkTeacherToken(teacherId,teacherToken))
            return Utils.RJson({e:'tb2'}, 400, 'Teacher token failed', false)

        // 检查班级bind临时token
        const cacheClassroomValue = await KvCache.get<{token: string, channel: string}>({prefix: 'gct_', key: classroomId})
        if (!cacheClassroomValue
            || cacheClassroomValue.channel !== 'classroom_bind'//检测渠道类型
            || cacheClassroomValue.token !== classroomToken) {//匹配
            return Utils.RJson({e:'tb3'}, 400, 'Classroom token failed', false);
        }

        const account = await this._getTeacherUserAccount(teacherId)

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
        if (!teacherId || !classroomId || !teacherToken) {
            return Utils.RJson({e:'tub1'}, 400, 'Request failed', false);
        }

        //检查token
        if (!await this._checkTeacherToken(teacherId,teacherToken))
            return Utils.RJson({e:'tub2'}, 400, 'Teacher token failed', false)

        const account = await this._getTeacherUserAccount(teacherId);
        if (!account.userData.bindClassroom || !account.userData.bindClassroom.includes(classroomId)) {
            return Utils.RJson({e:'tub3'}, 400, 'Classroom not bound', false);
        }
        
        account.userData ??= {};//如果存在
        account.userData.bindClassroom ??= [];
        
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

    async _getTeacherUserAccount(teacherId: string) {
        //读取
        const user = await KvCache.get<string>({prefix: 'ud_', key: teacherId})
        if (!user) {
            return Utils.RJson({e:'gtud1'}, 404, 'UD not found', false);
        }
        const userAccount = JSON.parse(user)
        return userAccount
    },
    async _checkTeacherToken(teacherId: string, teacherToken: string){
        // 检查老师token
        const cacheTeacherValue = await KvCache.get({prefix: 'lr_', key: teacherId})
        if (!!cacheTeacherValue && cacheTeacherValue === teacherToken) {
            return true;
        }
        return false;
    },
}
export default Bind
