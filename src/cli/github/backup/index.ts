import { RestEndpointMethodTypes } from '@octokit/rest';
import fs from 'fs-extra';
import { cpus } from 'os';
import pAll from 'p-all';
import { dirname } from 'path';
import got from 'got';
import { pipeline } from 'stream/promises';
import { AbstractGithubBackup } from '../protocol';
import { GithubIssueBackup } from './issue';
import { GithubPullRequestBackup } from './pull-request';
import { GithubLabelBackup } from './lable';
import { GithubSettingsBackup } from './settings';
import { GithubCodeBackup } from './code';

export class GithubBackup extends AbstractGithubBackup {

  async backup() {

    const backups: AbstractGithubBackup[] = [
      new GithubIssueBackup(this.options),
      new GithubPullRequestBackup(this.options),
      new GithubLabelBackup(this.options),
      new GithubSettingsBackup(this.options),
      new GithubCodeBackup(this.options)
    ]

    await Promise.all(
      backups.map(x => x.backup())
    );
  }



  async backupIssues(repoName: string, issues: RestEndpointMethodTypes["issues"]["listForRepo"]["response"]): Promise<void> {
    await pAll(
      issues.data.filter(x => !x.pull_request).map(issue => {
        return async () => {

          const org = this.options.org;
          const comments = await this.octokit.issues.listComments({
            owner: org,
            repo: repoName,
            issue_number: issue.number,
          })

          // TODO: 自定义类型
          const data = { ...issue, extra: { comments } }
          const issuePath = this.getIssuePath(repoName, issue.number)

          await fs.ensureDir(dirname(issuePath))
          await fs.writeJson(issuePath, data);
        }
      }), {
      concurrency: cpus().length,
    })
  }

  async backupPullRequests(repoName: string, pullRequests: RestEndpointMethodTypes["pulls"]["list"]["response"]): Promise<void> {
    await pAll(
      pullRequests.data.map(pullRequest => {
        return async () => {

          const org = this.options.org;
          const comments = await this.octokit.issues.listComments({
            owner: org,
            repo: repoName,
            issue_number: pullRequest.number,
          })

          // TODO: 自定义类型
          const data = { ...pullRequest, extra: { comments } }
          const pullRequestPath = this.getPullRequestPath(repoName, pullRequest.number)

          await fs.ensureDir(dirname(pullRequestPath))
          await fs.writeJson(pullRequestPath, data);
        }
      }), {
      concurrency: cpus().length,
    })
  }

  async backupSettings(settings: RestEndpointMethodTypes["repos"]["get"]["response"]): Promise<void> {
    const settingsPath = this.getSettingsPath(settings.data.name);

    await fs.ensureDir(dirname(settingsPath))
    await fs.writeJson(settingsPath, settings.data);
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


  async backupLabel(repoName: string): Promise<void> {
    const response = await this.octokit.issues.listLabelsForRepo({
      owner: this.options.org,
      repo: repoName,
    });

    const labelPath: string = this.getLabelPath(repoName);

    await fs.ensureDir(dirname(labelPath))
    await fs.writeJson(labelPath, response.data)
  }
}