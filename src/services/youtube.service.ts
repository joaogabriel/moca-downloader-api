import ytdl from 'ytdl-core';

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

}
