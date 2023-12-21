import { GithubIssueBackup } from './issue';
import { GithubLabelBackup } from './label';
import { GithubSettingsBackup } from './settings';
import { GithubCodeBackup } from './code';
import { GithubMilestoneBackup } from './milestone';
import { AbstractGithubBackup } from '../protocol';
<<<<<<< HEAD
import { Repo, ReposBackupProgress } from '../state';
=======
import { ReposBackupProgress } from '../state';
>>>>>>> release


export class GithubBackup extends AbstractGithubBackup {

  async backup() {
    const repositoryList = await this.listForOrg();

<<<<<<< HEAD
    // @FIXME: 这一段实在是很丑陋,后续改进一下 @jianchao
=======
>>>>>>> release
    const progress = new ReposBackupProgress(this.options);
    await progress.init(repositoryList.map(x => {
      return {
        name: x.name
      }
    }));
<<<<<<< HEAD
    const repos: Repo[] = (await progress.findRemaining());
=======
    const repos = await progress.findRemaining();
>>>>>>> release

    for (const repo of repos) {
      try {
        await this.backupRepository(repo.name);
        await progress.delete(repo.name);
      } catch (error) {
        console.error('GithubBackup.backup throw an error:', error.message);
        console.error(error);
        break;
      } finally {
<<<<<<< HEAD
        if (await progress.isEmpty()) {
          await progress.done();
        }
        await progress.printProgress({ repoName: repo.name });
=======
        await progress.printProgress({ repoName: repo.name });
        if (await progress.isEmpty()) {
          await progress.done();
        }
>>>>>>> release
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