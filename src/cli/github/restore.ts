import { Command } from "commander";
import { GithubRestore } from "./restore/index";

function restoreCommand(): Command {
    const command = new Command();

    command
        .name("restore")
        .requiredOption("-o, --org <org>", "Organization name")
        .requiredOption("-t, --token <token>", "Personal token")
        .description("Restore github repo")
        .action(async (options: Record<string, any>) => {

            const org = options.org;
            const token = options.token;

            if (org && token) {
                return new GithubRestore({ org, token }).restore();
            }

            return command.help();
        });

    return command;
}


export { restoreCommand };
