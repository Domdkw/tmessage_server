import { Hono } from 'hono'

import Login from './src/login.ts'
import Bind from './src/bind.ts'


const app = new Hono();
const api = app.basePath('/api/v1');
const teacher = api.basePath('/teacher');
const classroom = api.basePath('/classroom');

app.get('/', (c) => { return c.text('TMessage Server is running!') })

teacher.post('/:teacherId/login', async(c) => {
    const teacherId = c.req.param('teacherId')
    const q = await c.req.json<{username: string, password: string}>()
    const result = await Login.teacher({
        userid: teacherId!,
        username: q.username,
        password: q.password,
    })
    return c.json(result)
})

teacher.post('/:teacherId/refresh', async(c) => {
    const teacherId = c.req.param('teacherId')
    const q = c.req.query('token')
    const result = await Login.refresh({
        userid: teacherId!,
        token: q || '',
    })
    return c.json(result)
})

classroom.post('/:classroomId/get_bind_token', async(c) => {
    const classroomId = c.req.param('classroomId')
    const result = await Bind.generateClassroomToken(classroomId!)
    return c.json(result)
})

teacher.post('/:teacherId/bind', async(c) => {
    const teacherId = c.req.param('teacherId')
    const q = await c.req.json<{c: string, h: string, t: string}>()
    const result = await Bind.teacherBind({
        teacherId: teacherId!,//写入
        teacherToken: q.t,//验证
        classroomId: q.c,//写入
        classroomToken: q.h,//临时验证
    })
    return c.json(result)
})

teacher.post('/:teacherId/unbind', async(c) => {
    const teacherId = c.req.param('teacherId')
    const q = await c.req.json<{c: string, t: string}>()
    const result = await Bind.teacherUnbind({
        teacherId: teacherId!,//写入
        classroomId: q.c,//写入
        teacherToken: q.t,//验证
    })
    return c.json(result)
})



Deno.serve(app.fetch)
