import { GithubIssueBackup } from './issue';
import { GithubLabelBackup } from './label';
import { GithubSettingsBackup } from './settings';
import { GithubCodeBackup } from './code';
import { GithubMilestoneBackup } from './milestone';
import { AbstractGithubBackup, Repo } from '../protocol';


export class GithubBackup extends AbstractGithubBackup {

  async backup() {
    const repos = await this.octokit.repos.listForOrg({
      org: this.options.org,
    });

    for (const repo of repos.data) {
      await this.backupRepository(repo);
    }

  }

  async backupRepository(repo: Repo): Promise<void> {

    try {
      const backups: AbstractGithubBackup[] = [
        new GithubCodeBackup(this.options),
        new GithubMilestoneBackup(this.options),
        new GithubLabelBackup(this.options),
        new GithubIssueBackup(this.options),
        new GithubSettingsBackup(this.options),
      ]

      await Promise.all(
        backups.map(x => x.backupRepository(repo))
      );

      console.log('backup ok', repo.full_name);
    } catch (error) {
      console.error(error);
    }

  }
}