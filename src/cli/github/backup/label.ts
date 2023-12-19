import fs from 'fs-extra';
import { cpus } from 'os';
import pAll from 'p-all';
import { dirname } from 'path';
import { AbstractGithubBackup } from '../protocol';

export class GithubLabelBackup extends AbstractGithubBackup {

    async backup() {
        const repos = await this.listForOrg();

        await pAll(
            repos.map(repo => {
                return async () => {
                    await this.backupRepository(repo.name);
                }
            }),
            {
                concurrency: cpus().length,
            }
        );
    }

    async backupRepository(repoName: string): Promise<void> {

        const response = await this.octokit.issues.listLabelsForRepo({
            owner: this.options.org,
            repo: repoName,
        });

        const labelPath: string = this.getLabelPath(repoName);

        await fs.ensureDir(dirname(labelPath))
        await fs.writeJson(labelPath, response.data)
    }
}