import { Command } from "commander";
import { backupCommand } from "./backup";

function githubCommand() {
  const command = new Command();

  command
    .name("github")
    .description("Github backup, restore tools")
    .addCommand(backupCommand());

  return command;
}



export { githubCommand };
