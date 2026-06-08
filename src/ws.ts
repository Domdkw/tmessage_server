import { Hono } from 'hono'
import { upgradeWebSocket } from 'hono/deno'

import Utils from './utils.ts'
import User from './user.ts'


export const wsRouter = new Hono();

wsRouter.get('/classroom/:classroomId',
    upgradeWebSocket((c) => {
    return {
        onMessage(event, ws) {
        },
        onClose: (event) => {
            if (!event.wasClean) {
                console.warn('ws closed e:', event.code, event.reason)
            }
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
    return Utils.RJson({classroomId: message.c}, 200, 'Message sent', true);
}