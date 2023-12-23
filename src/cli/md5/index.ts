import { Command } from "commander";
import { md5, md5Info } from "../../classes/md5";

function md5Command() {
  const command = new Command();

  command
    .name("md5")
    .description("Get md5 info")
    .argument("[path]", "Get md5 info(size, hash etc) for a specified path")
    .action(async (path: string) => {

      if (!path) {
        return command.help();
      }

      const info: md5Info = await md5.getInfo(path);
      console.log(info);
    });


  return command;
}



export { md5Command };
