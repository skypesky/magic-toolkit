import { GithubIssueBackup } from './issue';
import { GithubLabelBackup } from './label';
import { GithubSettingsBackup } from './settings';
import { GithubCodeBackup } from './code';
import { GithubMilestoneBackup } from './milestone';
import { AbstractGithubBackup } from '../protocol';
import { ReposBackupProgress } from '../state';


export class GithubBackup extends AbstractGithubBackup {

  async backup() {
    const { data } = await this.octokit.repos.listForOrg({
      org: this.options.org,
    });

    const progress = new ReposBackupProgress(this.options);
    await progress.init(data.map(x => {
      return {
        name: x.name
      }
    }));
    const repos = await progress.findRemaining();

    for (const repo of repos) {
      try {
        await this.backupRepository(repo.name);
        await progress.delete(repo.name);
      } catch (error) {
        console.error('Error during backup:', error.message);
        break;
      } finally {
        await progress.printProgress({ repoName: repo.name });
        if (await progress.isEmpty()) {
          await progress.done();
        }
      }
    }

  }

  async backupRepository(repoName: string): Promise<void> {

    const backups: AbstractGithubBackup[] = [
      new GithubCodeBackup(this.options),
      new GithubMilestoneBackup(this.options),
      new GithubLabelBackup(this.options),
      new GithubIssueBackup(this.options),
      new GithubSettingsBackup(this.options),
    ]

    await Promise.all(
      backups.map(x => x.backupRepository(repoName))
    );
  }
}