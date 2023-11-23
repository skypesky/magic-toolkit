import { Command } from "commander";
import { defaultCommand } from "./default";

function md5Command() {
  const command = new Command();

  command
    .name("md5")
    .description("Get md5 info")
    .addCommand(defaultCommand(), { isDefault: true });

  return command;
}



export { md5Command };
