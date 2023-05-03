import Fastify from 'fastify';
import {z, ZodError} from 'zod';
import {YoutubeService} from './services/youtube.service';
import {EventService} from './services/event.service';
import path from 'path';
import fs from 'fs';
import {promisify} from 'util';
import fastifyStatic from '@fastify/static';

const fastify = Fastify({
    logger: true
});
const {readdirSync, unlinkSync, existsSync, mkdirSync} = fs;
const pathBasenameFunction = path.basename;
const downloadsDir = './downloads';
const prepareDownloadPromise = promisify(YoutubeService.prepareDownload);

if (!existsSync(downloadsDir)) {
    mkdirSync(downloadsDir);
}

fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../'),
    setHeaders: (res, path) => {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename=${pathBasenameFunction(path)}`);
        res.setHeader('Accept-Ranges', 'bytes');
    }
})

fastify.get('/health', async (request, reply) => {
    reply.status(200).send('ok');
});

fastify.get('/video/info', async (request, reply) => {
    try {
        const urlSchema = z.object({
            url: z.string().url()
        });
        const {url} = urlSchema.parse(request.query);
        console.log(`video info request for ${url} from ${request.ip} (${request.hostname})`)
        const info = await YoutubeService.getVideoInfo(url);
        await EventService.registerInfo({
            url,
            title: info.title,
            hostname: request.hostname,
            ip: request.ip
        });
        console.log('video info request success', info)
        reply.status(200).send(info);
    } catch (error: ZodError | any) {
        console.error(error);
        if (error instanceof ZodError) {
            const message = error.issues ? error.issues[0].message : 'Generic error';
            reply.status(400).send(message);
        }
        reply.status(500).send('Internal server error');
    }
});

fastify.get('/video/download', async (request, reply) => {
    try {
        const downloadSchema = z.object({
            url: z.string().url(),
            title: z.string()
        });
        const {url, title} = downloadSchema.parse(request.query);
        console.log(`video download request for ${title} from ${request.ip} (${request.hostname})`)
        await prepareDownloadPromise(url, title, reply);
    } catch (error: any) {
        console.error(error);
        if (error instanceof ZodError) {
            const message = error.issues ? error.issues[0].message : 'Generic error';
            reply.status(400).send(message);
        }
        reply.status(500).send('Internal server error');
    }
});

// app.addHook('preHandler', (request, reply, done) => {
//     console.log(request.url)
//     const {
//         api_key
//     } = request.headers;
//     if (api_key === process.env.API_KEY) {
//         done();
//         return;
//     }
//     reply.code(401).send('Please provide a valid API key');
// });

fastify.listen({
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 9000,
}, (err, address) => {
    if (err) throw err;
    console.log(`Server listening on ${address}`);
});
