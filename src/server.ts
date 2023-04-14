import fastify from 'fastify';
import ytdl from 'ytdl-core';

const app = fastify();

app.get('/video/info', async (request, reply) => {
    try {
        const {videoURL} = request.query;
        const {
            player_response: {
                videoDetails: {title, author},
            },
        } = await ytdl.getBasicInfo(videoURL);
        reply.status(200).send({
            status: true,
            title,
            author,
        });
        // next();
    } catch (e) {
        console.log(e);
    }
});

app.get('/video/download', async (request, reply) => {
    try {
        const {
            videoURL, downloadFormat, quality, title,
        } = request.query;
        // if (downloadFormat === 'audio-only') {

        console.log('videoURL', videoURL)

        let info = await ytdl.getInfo(videoURL);
        let format = ytdl.chooseFormat(info.formats, {quality: '134'});
        console.log('Format found!', format);
        // console.log(info);

        reply.header('Content-Disposition', `attachment; filename=${title}.mp3`);

        ytdl(videoURL, {
            filter: 'audioonly',
            // quality: 'medium'
        }).pipe(reply.raw);
        // } else {
        //     res.header(
        //         'Content-Disposition',
        //         `attachment; filename="${title.substring(0, 25)}.mp4"`,
        //     );
        //     ytdl(videoURL, {
        //         filter: downloadFormat === 'video-only' ? 'videoonly' : 'audioandvideo',
        //         quality: quality === 'high' ? 'highestvideo' : 'lowestvideo',
        //     }).pipe(res);
        // }
    } catch (e) {
        console.log(e);
    }
});

app.listen({
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3000,
}, (err, address) => {
    if (err) throw err;
    console.log(`Server listening on ${address}`);
});
