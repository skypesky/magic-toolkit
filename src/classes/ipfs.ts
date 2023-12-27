import { createReadStream } from "fs";
import { isAbsolute, join } from "path";
import { cwd } from "process";
import {onlyHash} from '@arcblock/ipfs-only-hash';
import { CID } from "multiformats";
import { pathExists, statSync } from "fs-extra";
import xbytes from "xbytes";
import prettyMilliseconds from 'pretty-ms';

export interface IPFSInfo {
    absolutePath: string,
    cidV0: string,
    cidV1: string,
    size: string;
    duration: string;
}

export class ipfs {

    static async getInfo(path: string): Promise<IPFSInfo> {


        const absolutePath = isAbsolute(path) ? path : join(cwd(), path);

        if (!await pathExists(absolutePath)) {
            throw new Error(`Could not find file ${absolutePath}`);
        }

        const startTime = Date.now();
        const readStream = createReadStream(absolutePath);
        const size: number = statSync(absolutePath).size;

        const cidV0: string = await onlyHash(readStream);
        const cidV1: string = CID.parse(cidV0).toV1().toString();
        const duration: string = prettyMilliseconds(Date.now() - startTime);

        return {
            absolutePath,
            cidV0,
            cidV1,
            size: `${size} bytes(${xbytes(size)})`,
            duration,
        }
    }

}