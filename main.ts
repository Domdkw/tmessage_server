import { Hono } from 'hono'

import Login from './src/login.ts'
import Bind from './src/bind.ts'
import Utils from './src/utils.ts'
import { wsRouter } from './src/message.ts'


const app = new Hono();
const api = app.basePath('/api/v1');
const teacher = api.basePath('/teacher');
const classroom = api.basePath('/classroom');

app.get('/', (c) => { return c.text('TMessage Server is running!') })

teacher.post('/:teacherId/login', async(c) => {
    try{
    const teacherId = c.req.param('teacherId')
    const q = await c.req.json<{username: string, password: string}>()
    if (!q.username || !q.password) {
        return c.json( Utils.RJson({}, 400, 'Login failed', false) ,400);
    }

    const result = await Login.teacher({
        userid: teacherId!,
        username: q.username,
        password: q.password,
    })
    return c.json(result)
    }catch(e){
        return c.json( Utils.RJson({e:(e as Error).message}, 500, 'json', false) ,500)
    }
})

teacher.post('/:teacherId/refresh', async(c) => {
    const teacherId = c.req.param('teacherId')
    const token = Utils.getBearerToken(c)
    if (!token) {
        return c.json( Utils.RJson({}, 400, 'Refresh failed', false) ,400);
    }

    const result = await Login.refresh({
        userid: teacherId!,
        token: token,
    })
    return c.json(result)
})

classroom.post('/:classroomId/get_bind_token', async(c) => {
    const classroomId = c.req.param('classroomId')
    if (!classroomId) {
        return c.json( Utils.RJson({e:'ct1'}, 400, 'Request failed', false) ,400);
    }
    const result = await Bind.generateClassroomToken(classroomId!)
    return c.json(result)
})

teacher.post('/:teacherId/bind', async(c) => {
    try{
    const teacherId = c.req.param('teacherId')
    const q = await c.req.json<{c: string, h: string}>()
    const token = Utils.getBearerToken(c);
    if (!q.c || !q.h || !token) {
        return c.json( Utils.RJson({e:'tb1'}, 400, 'Request failed', false) ,400);
    }
    const result = await Bind.teacherBind({
        teacherId: teacherId!,//写入
        teacherToken: token,//验证
        classroomId: q.c,//写入
        classroomToken: q.h,//临时验证
    })
    return c.json(result)
    }catch(e){
        return c.json( Utils.RJson({e:(e as Error).message}, 500, 'json', false) ,500)
    }
})

teacher.post('/:teacherId/unbind', async(c) => {
    const teacherId = c.req.param('teacherId')
    const classroomId = c.req.query('classroomId')
    const token = Utils.getBearerToken(c);
    if (!classroomId || !token) {
        return c.json( Utils.RJson({e:'tb1'}, 400, 'Request failed', false) );
    }
    const result = await Bind.teacherUnbind({
        teacherId: teacherId!,//写入
        teacherToken: token,//验证
        classroomId: classroomId,//写入
    })
    return c.json(result)
})


api.route('/ws', wsRouter)

Deno.serve(app.fetch)
