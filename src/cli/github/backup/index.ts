import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import fs from 'fs-extra';
import fetch from 'node-fetch';
import { cpus } from 'os';
import pAll from 'p-all';
import { dirname, join } from 'path';
import got from 'got';
import { pipeline } from 'stream/promises';

export interface GithubBackupOptions {
  // github 组织名称
  org: string;

  // github personal token
  token: string;

  /**
   * @description 
   * @default process.cwd()
   * @type {string}
   * @memberof GithubBackupOptions
   */
  dir?: string;
}

export class GithubBackup {

  readonly options: GithubBackupOptions;
  readonly octokit: Octokit;

  constructor(options: GithubBackupOptions) {
    this.options = {
      dir: process.cwd(),
      ...options
    };
    this.octokit = new Octokit({
      auth: this.options.token, // 请替换为你的个人访问令牌
      request: {
        fetch
      }
    });
  }

  async backup() {
    const { org } = this.options;
    const repos = await this.octokit.repos.listForOrg({
      org: org
    });

    await pAll(
      repos.data.map(repo => {
        return async () => {

          const repoName = repo.name;

          const issues: RestEndpointMethodTypes["issues"]["listForRepo"]["response"] = await this.octokit.issues.listForRepo({
            owner: org,
            repo: repoName,
          });

          await this.backupIssues(repoName, issues);

          const pullRequests: RestEndpointMethodTypes['pulls']["list"]["response"] = await this.octokit.pulls.list({
            owner: org,
            repo: repoName
          })
          await this.backupPullRequests(repoName, pullRequests)

          const settings: RestEndpointMethodTypes["repos"]["get"]["response"] = await this.octokit.repos.get({
            owner: org,
            repo: repoName,
          });

          await this.backupSettings(settings);

          await this.backupCode(repoName);
          await this.backupLabel(repoName);
        }
      }),
      {
        concurrency: cpus().length,
      }
    );
  }

  getRepoPath(repoName: string): string {
    return join(this.options.dir, this.options.org, repoName);
  }

  getIssuePath(repoName: string, issueNumber: number) {
    return join(this.getRepoPath(repoName), `.meta/issue/${issueNumber}.json`)
  }

  getPullRequestPath(repoName: string, issueNumber: number) {
    return join(this.getRepoPath(repoName), `.meta/pull/${issueNumber}.json`)
  }

  getCodePath(repoName: string): string {
    return join(this.getRepoPath(repoName), '.meta/source.tar.gz')
  }

  getLabelPath(repoName: string): string {
    return join(this.getRepoPath(repoName), '.meta/label.json')
  }

  getSettingsPath(repoName: string) {
    return join(this.getRepoPath(repoName), `.meta/settings.json`)
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