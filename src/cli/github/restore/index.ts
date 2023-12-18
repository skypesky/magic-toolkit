import { AbstractGithubRestore } from "../protocol/restore";
import { GithubCodeRestore } from "./code";
import { GithubIssueRestore } from "./issue";
import { GithubLabelRestore } from "./label";
import { GithubSettingsRestore } from "./settings";

export class GithubRestore extends AbstractGithubRestore {

    async restore(): Promise<void> {

        // ensureCreateRepository();

        const backups: AbstractGithubRestore[] = [
            new GithubIssueRestore(this.options),
            new GithubLabelRestore(this.options),
            new GithubSettingsRestore(this.options),
            new GithubCodeRestore(this.options)
        ]

        await Promise.all(
            backups.map(x => x.restore())
        );
    }

}