import { Command } from "commander";
import { ipfsCommand } from "../cli/ipfs";
import { md5Command } from "../cli/md5";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../../package.json");

export function createProgram() {
  // @see: https://www.npmjs.com/package/commander
  const command = new Command();

  command
    .name("mt")
    .version(version)
    .action(async () => {
      command.help();
    });

  command.addCommand(ipfsCommand());
  command.addCommand(md5Command())

  return command;
}
