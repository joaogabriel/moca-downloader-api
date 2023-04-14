import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EventService {

    static async registerInfo(event: any) {
        const { url, title, hostname, ip } = event;
        await this.createEvent('INFO', url, title, hostname, ip);
    }

    static async registerDownload(event: any) {
        const { url, title, hostname, ip } = event;
        await this.createEvent('DOWNLOAD', url, title, hostname, ip);
    }

    private static async createEvent(type: string, url: string, title: string, hostname: string, ip: string) {
        await prisma.event.create({
            data: {
                type,
                url,
                title,
                hostname,
                ip
            }
        });
    }

}
