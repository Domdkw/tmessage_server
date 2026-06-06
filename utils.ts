const Utils = {
    RJson(data: object, code: number, msg: string, success: boolean) {
        if (!data) {
            data = {};
        }
        const res = {
            code: code || 0,
            data: data,
            msg: msg || '',
            success: success || false
        }
        return res;
    },
    generateToken() {
        const token = Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        return token;
    }
}
export default Utils