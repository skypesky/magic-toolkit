import { Command } from "commander";
import { GithubBackup } from "./backup/index";

function backupCommand(): Command {
  const command = new Command();

  command
    .name("backup")
    .requiredOption("-o, --org <org>", "Organization name")
    .requiredOption("-t, --token <token>", "Personal token")
    .option("-r, --repos <repos>", "Specify repository, multiple repositories , interval", '')
    .option("-d, --dir <dir>", "Path to the backup folder", undefined)
    .description("Backup github repo")
    .action(async (options: Record<string, any>) => {

      const org = options.org;
      const token = options.token;
      const repos = options.repos.split(",").map(x => x.trim()).filter(Boolean);
      const dir = options.dir;

      if (org && token) {
        return new GithubBackup({ org, token, repos, dir }).backup();
      }

      return command.help();
    });

  return command;
}


export { backupCommand };
