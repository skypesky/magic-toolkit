import { Command } from "commander";
import { createReadStream, existsSync } from "fs-extra";
import { isAbsolute, join } from "path";
import { cwd } from "process";
import Hash from 'ipfs-only-hash';
import { CID } from 'multiformats';
import { IPFSInfo, ipfs } from "../../classes";

function defaultCommand(): Command {
  const command = new Command();

  command
    .name("search")
    .argument("[path]", "Get ipfs info(size, cid etc) for a specified path")
    .description("Get ipfs info")
    .action(async (path: string) => {

      if (!path) {
        return command.help();
      }

      const info: IPFSInfo = await ipfs.getInfo(path);
      console.log(info)
    });

  return command;
}


export { defaultCommand };
