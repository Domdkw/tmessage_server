export const CACHE_TTL = 300000 //5min

/**
 * 业务前缀
 * ud_：用户数据
 * gct_：生成ClassroomToken
 * lr_：刷新token
 */
export type prefix = 'ud_' | 'gct_' | 'lr_'

const KvCache = {
    // 统一的 KV 实例
    _kv: null as Deno.Kv | null,
    
    async _getKv(): Promise<Deno.Kv> {
        if (!this._kv) {
            this._kv = await Deno.openKv('./tms_kv')
        }
        return this._kv
    },

    /**
     * 设置缓存数据
     * @param ttl 过期时间（毫秒）
     * @param prefix 业务前缀
     */
    async set<T>(
        {key, value, ttl, prefix}: {
            key: string, 
            value: object|string|number|boolean, 
            ttl?: number,
            prefix: prefix
        },
        callback: () => T,
        errorCallback?: (err: Error) => T
    ): Promise<T | undefined> {
        try{
            if (!key || !value || !prefix) {
                return errorCallback?.(new Error('empty'))
            }
            const kv = await this._getKv()
            if (ttl === undefined || ttl === null || ttl === 0) {
                await kv.set([prefix, key], value)
            }else{
                await kv.set([prefix, key], value, {expireIn: ttl})
            }
            return callback()
        }catch(err){
            console.error(err)
            return errorCallback?.(err as Error)
        }
    },
    
    /**
     * 获取缓存数据
     * @param prefix 业务前缀
     */
    async get<T>(
        {key, prefix}: {key: string, prefix: prefix}
    ): Promise<T | undefined> {
        try{
            if (!key || !prefix) {
                return undefined
            }
            const kv = await this._getKv()
            const value = await kv.get([prefix, key])
            return value.value as T | undefined
        }catch(err){
            console.error(err)
            return undefined
        }
    },

}
export default KvCache
