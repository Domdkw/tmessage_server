import Utils from './utils.ts'
import KvCache from './kv_cache.ts'

const REFRESH_TTL = 60*24*60*60*1000 //60天

const Login = {
    async teacher( {userid, username, password}: {userid: string, username: string, password: string}){
        if (!username || !password || !userid) {
            return Utils.RJson({}, 400, 'Login failed', false);
        }

        const user = await KvCache.get<string>({prefix: 'ud_', key: userid})
        
        if (!user) {
            return Utils.RJson({}, 400, 'Login failed', false);
        }

        const userData = JSON.parse(user)

        if (userData.password !== password || userData.username !== username) {
            return Utils.RJson({}, 400, 'Login failed', false);
        }

        // 生成新token
        const newToken = await this._setNewToken(userid)
        if (!newToken) {
            return Utils.RJson({}, 500, 'Error _setNewToken', false)
        }
        
        return Utils.RJson({token: newToken, refresh_ttl: REFRESH_TTL}, 200, 'Login success', true);
    },

    async refresh( {userid, token}: {userid: string, token: string}){
        if (!token || !userid) {
            return Utils.RJson({}, 400, 'Refresh failed', false);
        }

        // 检查token是否有效
        const cachedToken = await KvCache.get<string>({prefix: 'lr_', key: userid})
        if (!cachedToken || cachedToken !== token) {
            return Utils.RJson({}, 400, 'Refresh failed', false);
        }
        
        // 生成新token
        const newToken = await this._setNewToken(userid)
        if (!newToken) {
            return Utils.RJson({}, 500, 'Error _setNewToken', false)
        }
        
        return Utils.RJson({token: newToken, refresh_ttl: REFRESH_TTL}, 200, 'refresh success', true);
    },

    async _setNewToken(userid: string){
        const newToken = Utils.generateToken();

        // 更新token缓存
        return await KvCache.set({prefix: 'lr_', key: userid, value: newToken, ttl: REFRESH_TTL}, ()=>{
            return newToken;
        }, (err: Error) => {
            console.error(err.message)
            return undefined
        })
    }
}
export default Login