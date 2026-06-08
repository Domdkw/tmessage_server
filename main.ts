import { Hono } from 'hono'

import Login from './src/login.ts'
import Bind from './src/bind.ts'
import Utils from './src/utils.ts'
import { wsRouter } from './src/ws.ts'


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
        return c.json( Utils.RJson({}, 400, 'Login failed', false) );
    }

    const result = await Login.teacher({
        userid: teacherId!,
        username: q.username,
        password: q.password,
    })
    return c.json(result)
    }catch(e){
        return c.json( Utils.RJson({e:(e as Error).message}, 500, 'try', false) )
    }
})

teacher.post('/:teacherId/refresh', async(c) => {
    const teacherId = c.req.param('teacherId')
    const q = c.req.query('token')
    if (!q) {
        return c.json( Utils.RJson({}, 400, 'Refresh failed', false) );
    }

    const result = await Login.refresh({
        userid: teacherId!,
        token: q || '',
    })
    return c.json(result)
})

classroom.post('/:classroomId/get_bind_token', async(c) => {
    const classroomId = c.req.param('classroomId')
    if (!classroomId) {
        return c.json( Utils.RJson({e:'ct1'}, 400, 'Request failed', false) );
    }
    const result = await Bind.generateClassroomToken(classroomId!)
    return c.json(result)
})

teacher.post('/:teacherId/bind', async(c) => {
    try{
    const teacherId = c.req.param('teacherId')
    const q = await c.req.json<{c: string, h: string, t: string}>()
    if (!q.c || !q.h || !q.t) {
        return c.json( Utils.RJson({e:'tb1'}, 400, 'Request failed', false) );
    }
    const result = await Bind.teacherBind({
        teacherId: teacherId!,//写入
        teacherToken: q.t,//验证
        classroomId: q.c,//写入
        classroomToken: q.h,//临时验证
    })
    return c.json(result)
    }catch(e){
        return c.json( Utils.RJson({e:(e as Error).message}, 500, 'try', false) )
    }
})

teacher.post('/:teacherId/unbind', async(c) => {
    try{
    const teacherId = c.req.param('teacherId')
    const q = await c.req.json<{c: string, t: string}>()
    if (!q.c || !q.t) {
        return c.json( Utils.RJson({e:'tb2'}, 400, 'Request failed', false) );
    }
    const result = await Bind.teacherUnbind({
        teacherId: teacherId!,//写入
        classroomId: q.c,//写入
        teacherToken: q.t,//验证
    })
    return c.json(result)
    }catch(e){
        return c.json( Utils.RJson({e:(e as Error).message}, 500, 'try', false) )
    }
})


api.route('/ws', wsRouter)

Deno.serve(app.fetch)
