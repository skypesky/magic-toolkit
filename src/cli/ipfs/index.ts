import { Command } from "commander";
import { IPFSInfo, ipfs } from "../../classes";

function ipfsCommand() {
  const command = new Command();

  command
    .name("ipfs")
    .description("Get ipfs info")
    .argument("[path]", "Get ipfs info(size, cid etc) for a specified path")
    .action(async (path: string) => {

      if (!path) {
        return command.help();
      }

      const info: IPFSInfo = await ipfs.getInfo(path);
      console.log(info);
    });

  return command;
}

export { ipfsCommand };
