import { existsSync, remove } from 'fs-extra';
import { cpus } from 'os';
import pAll from 'p-all';
import { AbstractGithubBackup } from '../protocol';
import simpleGit from 'simple-git';

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
    const repoPath = `https://${this.options.token}@github.com/${this.options.org}/${repoName}.git`;
    const localCodePath = this.getCodePath(repoName);

    try {

      if (existsSync(localCodePath)) {
        await remove(localCodePath)
      }

      // Clone private repository with token
      await simpleGit().clone(repoPath, localCodePath, ['--mirror']);
    } catch (error) {
      console.error('Error during backup code:', error.message);
    }
  }

}