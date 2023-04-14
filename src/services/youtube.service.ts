import ytdl from 'ytdl-core';

class YoutubeService {
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

    static async getVideoDownloadURL(videoURL: string) {
        let info = await ytdl.getInfo(videoURL);
        let format = ytdl.chooseFormat(info.formats, {quality: '134'});
        console.log('Format found!', format);
        return format.url;
    }
}
