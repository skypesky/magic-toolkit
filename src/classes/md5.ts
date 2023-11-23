import { existsSync } from "fs";
import { isAbsolute, join } from "path";
import { cwd } from "process";
import { createReadStream, statSync } from "fs-extra";
import xbytes from "xbytes";
import prettyMilliseconds from 'pretty-ms';
import hasha from "hasha";

export interface md5Info {
    absolutePath: string,
    md5: string,
    size: string;
    duration: string;
}

export class md5 {

    static async getInfo(path: string): Promise<md5Info> {


        const absolutePath = isAbsolute(path) ? path : join(cwd(), path);

        if (!existsSync(absolutePath)) {
            throw new Error(`Could not find file ${absolutePath}`);
        }

        const startTime = Date.now();
        const size: number = statSync(absolutePath).size;

        const md5: string = await hasha.fromStream(createReadStream(absolutePath), {algorithm: "md5"});
        const duration: string = prettyMilliseconds(Date.now() - startTime);

        return {
            absolutePath,
            md5,
            size: `${size} bytes(${xbytes(size)})`,
            duration,
        }
    }

}