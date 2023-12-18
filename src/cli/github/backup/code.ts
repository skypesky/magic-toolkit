import fs from 'fs-extra';
import { cpus } from 'os';
import pAll from 'p-all';
import got from 'got';
import { pipeline } from 'stream/promises';
import { AbstractGithubBackup } from '../protocol';

export class GithubCodeBackup extends AbstractGithubBackup {

  async backup() {
    const { org } = this.options;
    const repos = await this.octokit.repos.listForOrg({
      org: org
    });

    await pAll(
      repos.data.map(repo => {
        return async () => {
          await this.backupCode(repo.name);
        }
      }),
      {
        concurrency: cpus().length,
      }
    );
  }

  async backupCode(repoName: string): Promise<void> {
    const response = await this.octokit.repos.downloadTarballArchive({
      owner: this.options.org,
      repo: repoName,
      ref: undefined
    });

    const stream = await got.stream(response.url)
    await pipeline(stream, fs.createWriteStream(this.getCodePath(repoName)));
  }

}