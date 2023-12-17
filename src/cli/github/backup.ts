import { Command } from "commander";
import { GithubBackup } from "./backup/index";

function backupCommand(): Command {
  const command = new Command();

  command
    .name("backup")
    .requiredOption("-o, --org <org>", "Organization name")
    .requiredOption("-t, --token <token>", "Personal token")
    .description("Backup github repo")
    .action(async (options: Record<string, any>) => {

      const org = options.org;
      const token = options.token;

      console.log(options)

      if (org && token) {
        return new GithubBackup({ org, token }).backup();
      }

      return command.help();
    });

  return command;
}


export { backupCommand };
