import { Command } from "commander";
import { md5, md5Info } from "../../classes/md5";

function defaultCommand(): Command {
  const command = new Command();

  command
    .name("search")
    .argument("[path]", "Get md5 info(size, hash etc) for a specified path")
    .description("Get md5 info")
    .action(async (path: string) => {

      if (!path) {
        return command.help();
      }

      const info: md5Info = await md5.getInfo(path);
      console.log(info)
    });

  return command;
}


export { defaultCommand };
