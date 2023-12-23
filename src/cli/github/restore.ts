import { Command } from "commander";
import { GithubRestore } from "./restore/index";

function restoreCommand(): Command {
    const command = new Command();

    command
        .name("restore")
        .requiredOption("-o, --org <org>", "Github organization name")
        .requiredOption("-t, --token <token>", "Github personal token")
        .option("-r, --repos <repos>", "Specific repository, multiple repositories, please use ',' split", '')
        .option("-d, --dir <dir>", "Path to the backup folder", undefined)
        .description("Restore github repos")
        .action(async (options: Record<string, string>) => {

            const org = options.org;
            const token = options.token;
            const repos = options.repos.split(",").map(x => x.trim()).filter(Boolean);
            const dir = options.dir;

            if (org && token) {
                return new GithubRestore({ org, token, repos, dir }).restore();
            }

            return command.help();
        });

    return command;
}


export { restoreCommand };
