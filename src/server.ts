import Fastify, {FastifyReply} from 'fastify';
import {z, ZodError} from 'zod';
import {YoutubeService} from './services/youtube.service';
import {EventService} from './services/event.service';
import ytdl from 'ytdl-core';
import path from 'path';
import fs from 'fs';
import {promisify} from 'util';
import fastifyStatic from '@fastify/static';

const fastify = Fastify({
    logger: true
});
const {readdirSync, unlinkSync, existsSync, mkdirSync} = fs;
const pathBasenameFunction = path.basename;

//create downloads dir if it does not exist
const downloadsDir = './downloads';
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
//
// app.get('/video/download/prepare', async (request, reply) => {
//     try {
//         const downloadSchema = z.object({
//             url: z.string().url(),
//             title: z.string()
//         });
//         const {url, title} = downloadSchema.parse(request.query);
//         await ytdl(url, {filter: 'audioonly'}).pipe(fs.createWriteStream(`./downloads/${title}.mp3`));
//         return reply
//             .send({title})
//             .type('application/json')
//             .code(200);
//     } catch (error: any) {
//         console.error(error);
//         if (error instanceof ZodError) {
//             const message = error.issues ? error.issues[0].message : 'Generic error';
//             reply.status(400).send(message);
//         }
//         reply.status(500).send('Internal server error');
//     }
// });
//
// app.get('/video/download', async (request, reply) => {
//     try {
//         const downloadSchema = z.object({
//             title: z.string()
//         });
//         const {title} = downloadSchema.parse(request.query);
//         console.log(`video download request for ${title} from ${request.ip} (${request.hostname})`)
//         return reply.download(
//             `./downloads/${title}.mp3`,
//             `${title}-download2.mp3`
//         );
//     } catch (error: any) {
//         console.error(error);
//         if (error instanceof ZodError) {
//             const message = error.issues ? error.issues[0].message : 'Generic error';
//             reply.status(400).send(message);
//         }
//         reply.status(500).send('Internal server error');
//     }
// });
//
//
//
//
function downloadMP3(url: string, title: string, reply: FastifyReply) {
    ytdl(url, {filter: 'audioonly'})
        .pipe(fs.createWriteStream(`./downloads/${title}.mp3`))
        .on("finish", async function () {
            // reply.header('Content-Disposition', `attachment; filename=${title}-download.MP3`);
            // reply.header('Accept-Ranges', 'bytes');

            // reply.headers({
            //     'Content-Type': 'audio/mpeg',
            //     'Content-Disposition': `attachment; filename=download.mp3`,
            //     'Accept-Ranges': 'bytes'
            // })
            // reply.header('Content-Type', 'audio/mpeg')
            return reply.download(
                `./downloads/${title}.mp3`,
                `${title}-download.mp3`,
                {
                    extensions: ['mp3']
                }
            );
        });
}

const pDownloadAndSend = promisify(downloadMP3);

fastify.get('/video/download-v2', async (request, reply) => {
    try {
        const downloadSchema = z.object({
            url: z.string().url(),
            title: z.string()
        });
        const {url, title} = downloadSchema.parse(request.query);
        console.log(`video download request for ${title} from ${request.ip} (${request.hostname})`)
        await pDownloadAndSend(url, title, reply);
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
