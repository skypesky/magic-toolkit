import { Command } from "commander";
import { backupCommand } from "./backup";
import { restoreCommand } from "./restore";

function githubCommand() {
  const command = new Command();

  command
    .name("github")
    .description("Github backup, restore tools")
    .addCommand(backupCommand())
    .addCommand(restoreCommand());

  return command;
}



export { githubCommand };
