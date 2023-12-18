import { RestEndpointMethodTypes } from '@octokit/rest';
import fs from 'fs-extra';
import { cpus } from 'os';
import pAll from 'p-all';
import { dirname } from 'path';
import { AbstractGithubBackup } from '../protocol';

export class GithubPullRequestBackup extends AbstractGithubBackup {

    async backup() {
        const { org } = this.options;
        const repos = await this.octokit.repos.listForOrg({
            org: org
        });

        await pAll(
            repos.data.map(repo => {
                return async () => {
                    await this.backupPullRequests(repo.name);
                }
            }),
            {
                concurrency: cpus().length,
            }
        );
    }

    async backupPullRequests(repoName: string): Promise<void> {

        const pullRequests: RestEndpointMethodTypes['pulls']["list"]["response"] = await this.octokit.pulls.list({
            owner: this.options.org,
            repo: repoName
        })

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

}


