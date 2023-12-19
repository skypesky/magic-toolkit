import fs from 'fs-extra';
import { cpus } from 'os';
import pAll from 'p-all';
import { dirname } from 'path';
import { AbstractGithubBackup, Repo } from '../protocol';

export class GithubLabelBackup extends AbstractGithubBackup {

    async backup() {
        const repos = await this.octokit.repos.listForOrg({
            org: this.options.org
        });

        await pAll(
            repos.data.map(repo => {
                return async () => {
                    await this.backupRepository(repo);
                }
            }),
            {
                concurrency: cpus().length,
            }
        );
    }

    async backupRepository(repo: Repo): Promise<void> {

        const repoName = repo.name;
        const response = await this.octokit.issues.listLabelsForRepo({
            owner: this.options.org,
            repo: repoName,
        });

        const labelPath: string = this.getLabelPath(repoName);

        await fs.ensureDir(dirname(labelPath))
        await fs.writeJson(labelPath, response.data)
    }
}