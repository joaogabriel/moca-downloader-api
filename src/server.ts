import fastify from 'fastify';
import {z, ZodError} from 'zod';
import {YoutubeService} from './services/youtube.service';
import {EventService} from "./services/event.service";
import ytdl from 'ytdl-core';

const app = fastify();

app.get('/video/info', async (request, reply) => {
    try {
        console.log(request.hostname);
        console.log(request.ip);
        const urlSchema = z.object({
            url: z.string().url()
        });
        const {url} = urlSchema.parse(request.query);
        const info = await YoutubeService.getVideoInfo(url);
        await EventService.registerInfo({
            url,
            title: info.title,
            hostname: request.hostname,
            ip: request.ip
        });
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

app.get('/video/download', async (request, reply) => {
    try {
        const downloadSchema = z.object({
            url: z.string().url(),
            title: z.string()
        });
        const {url, title} = downloadSchema.parse(request.query);
        reply.header('Content-Disposition', `attachment; filename=${title}.mp3`);
        await EventService.registerDownload({
            url,
            title,
            hostname: request.hostname,
            ip: request.ip
        });
        ytdl(url, {
            filter: 'audioonly',
        }).pipe(reply.raw);
    } catch (error: any) {
        console.error(error);
        if (error instanceof ZodError) {
            const message = error.issues ? error.issues[0].message : 'Generic error';
            reply.status(400).send(message);
        }
        reply.status(500).send('Internal server error');
    }
});

app.listen({
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3000,
}, (err, address) => {
    if (err) throw err;
    console.log(`Server listening on ${address}`);
});
