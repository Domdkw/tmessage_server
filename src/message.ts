import { Hono } from 'hono'
import { upgradeWebSocket } from 'hono/deno'


import Utils from './utils.ts'
import User from './user.ts'

export const wsRouter = new Hono();

const wsl = new Map<string, WebSocket>();

wsRouter.get('/classroom',
    upgradeWebSocket((c) => {
    return {
        async onMessage(event, ws) {
            try{
            //parse message
            let dataStr: string;
            if (event.data instanceof Blob) {
                return;
            } else if (typeof event.data === 'string') {
                dataStr = event.data;
                if (dataStr.length === 0) {
                    return;
                }
                //if (dataStr === 'HEARTBEAT') {
                //    ws.send('HEARTBEAT');
                //    return;
                //}
                if (dataStr[0] !== '{' || dataStr[dataStr.length - 1] !== '}') {
                    return; // not json 包括string&HEARTBEAT
                }
            } else {
                return;
            }
            const message = JSON.parse(dataStr);
            await onWSMessageReceived(message, ws);
            }
            catch(_e){
                ws.close(1000);
            }
        },
        onClose: (event, ws: any) => {
            if (!event.wasClean) {
                console.warn('ws closed e:', event.code, event.reason)
            }
            wsl.delete(ws.raw);
            console.log('ws closed e:', event.code, event.reason)
        },
    }
}));


wsRouter.post('/teacher/:teacherId/message', async(c) => {
    try{
    const teacherId = c.req.param('teacherId');
    const token = Utils.getBearerToken(c);
    const message = await c.req.json();
    if (!token || !teacherId) {
        return c.json( Utils.RJson({e:'tm1'}, 400, 'Request failed', false) )
    }
    if (!message.m || !message.c || !Array.isArray(message.c)) {
        return c.json( Utils.RJson({e:'tm2'}, 400, 'json format error', false) );
    }
    if(message.m.length > 10){
        return c.json( Utils.RJson({e:'tm3'}, 400, 'Message is too long', false) );
    }

    if (!await User.checkTeacherToken(teacherId, token)){
        return c.json( Utils.RJson({e:'tm4'}, 400, 'Teacher token failed', false) );
    }

    return c.json( await onTeacherMessage(teacherId, message) );

    }catch(e){
        return c.json( Utils.RJson({e:(e as Error).message}, 500, 'json', false) )
    }
});

export const onTeacherMessage = async (teacherId: string, message: {m: string, c: string[]}) => {
    const classroomIds = message.c;

    const account = await User.getUserAccount(teacherId);
    if (!account) {
        return Utils.RJson({e:'tm5'}, 400, 'Teacher account failed', false);
    }
    const bindClassroomIds = account.userData?.bindClassroom ?? [];
    if (!classroomIds.every(id => bindClassroomIds.includes(id))) {
        return Utils.RJson({e:'tm6'}, 400, 'Classroom not bound', false);
    }
    
    for (const classroomId of classroomIds) {
        const ws = wsl.get(classroomId);
        if (ws) {
            ws.send(JSON.stringify({type: 'teacher_send', data: {m: message.m}}));
            return Utils.RJson({classroomId: message.c}, 200, 'Message sent', true);
        }else{
            return Utils.RJson({e:'tm7'}, 400, 'Classroom not connected', false);
        }
    }
}

const onWSMessageReceived = (message: {type: string, data: object}, ws: any) => {
    const {type, data} = message;
    switch(type){
        //case 'p2p':
            //return await onP2PMessageReceived(data, ws);
        case 'regular':
            return onClassroomRegular(data as {c: string}, ws);
        default:
            return;
    }
}
const onClassroomRegular = (data: {c: string}, ws: any) => {
    const {c} = data;
    if (!c) {
        return;
    }
    if (wsl.has(c)) {
        return;
    }
    wsl.set(c, ws.raw);
    ws.send(JSON.stringify( Utils.RJson({classroomId: c, t: Date.now()}, 200, 'Classroom connected', true) ));
}