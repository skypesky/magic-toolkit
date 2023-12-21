import { AbstractGithubRestore, GithubRestoreOptions } from "../protocol/restore";
import { GithubCodeRestore } from "./code";
import { GithubIssueRestore } from "./issue";
import { GithubLabelRestore } from "./label";
import { GithubSettingsRestore } from "./settings";

export class GithubRestore extends AbstractGithubRestore {

  restoreInstances: AbstractGithubRestore[];

  constructor(options: GithubRestoreOptions) {
    super(options);
    this.restoreInstances = [
      new GithubCodeRestore(this.options),
      new GithubLabelRestore(this.options),
      new GithubIssueRestore(this.options),
      new GithubSettingsRestore(this.options),
    ];
  }

  async restore(): Promise<void> {
    const repoMetas = await this.findRepoMeta();

    if (repoMetas) {
      throw new Error('ok')
    }

    for (const repoMeta of repoMetas) {
      try {
        await this.restoreRepository(repoMeta.repoName);
      } catch (error) {
        console.error(error);
      }
    }

  }

  async restoreRepository(repoName: string): Promise<void> {

    await this.ensureRepositoryCreated(repoName);
    for (const restoreInstance of this.restoreInstances) {
      await restoreInstance.restoreRepository(repoName);
    }
  }

  async ensureRepositoryCreated(repoName: string): Promise<void> {
    try {
      const { data: existingRepo } = await this.octokit.repos.get({
        owner: this.options.org,
        repo: repoName,
      });
      if (!existingRepo) {
        await this.octokit.repos.createInOrg({
          org: this.options.org,
          name: repoName,
          visibility: 'private'
        });
      }
    } catch (error) {
      if (error.status === 404) {
        // 如果仓库不存在，则创建仓库
        await this.octokit.repos.createInOrg({
          org: this.options.org,
          name: repoName,
          visibility: 'private'
        });
      } else {
        // 如果发生其他错误，则输出错误信息
        console.error('Error checking or creating repository:', error.message);
        return;
      }
    }
  }
}