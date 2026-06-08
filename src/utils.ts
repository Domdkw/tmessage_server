import type { StatusCode } from 'hono/utils/http-status'
import type { Context } from 'hono'

type RJson<T> = {
    code: StatusCode,
    data: T,
    msg: string,
    success: boolean
}
const Utils = {
    RJson<T>(data: T,  code: StatusCode, msg: string, success: boolean): RJson<T> {
        const res = {
            code: code,
            data: data,
            msg: msg,
            success: success
        }
        return res;
    },
    generateToken() {
        const token = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        return token;
    },
    getBearerToken(c: Context){
        const header = c.req.header('Authorization');
        if (!header) {
            return null;
        }
        const [scheme, token] = header.split(' ');
        if (scheme.toLowerCase() !== 'bearer') {
            return null;
        }
        return token;
    }
}
export default Utils