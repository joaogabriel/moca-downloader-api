import ytdl from 'ytdl-core';
import {FastifyReply} from "fastify";
import fs from "fs";

export class YoutubeService {
    static async getVideoInfo(videoURL: string) {
        const {
            player_response: {
                videoDetails: {title, author},
            },
        } = await ytdl.getBasicInfo(videoURL);
        return {
            title,
            author,
        };
    }

    static prepareDownload(url: string, title: string, reply: FastifyReply) {
        ytdl(url, {filter: 'audioonly'})
            .pipe(fs.createWriteStream(`./downloads/${title}.mp3`))
            .on("finish", async function () {
                return reply.download(
                    `./downloads/${title}.mp3`,
                    `${title}-download.mp3`,
                    {
                        extensions: ['mp3']
                    }
                );
            });
    }

}
