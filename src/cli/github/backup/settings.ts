import { RestEndpointMethodTypes } from '@octokit/rest';
import fs from 'fs-extra';
import { cpus } from 'os';
import pAll from 'p-all';
import { dirname } from 'path';
import { AbstractGithubBackup } from '../protocol';

export class GithubSettingsBackup extends AbstractGithubBackup {

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

        const settings: RestEndpointMethodTypes["repos"]["get"]["response"] = await this.octokit.repos.get({
            owner: this.options.org,
            repo: repoName,
        });

        const settingsPath = this.getSettingsPath(settings.data.name);

        await fs.ensureDir(dirname(settingsPath))
        await fs.writeJson(settingsPath, settings.data);
    }

}