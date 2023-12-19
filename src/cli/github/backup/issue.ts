import { RestEndpointMethodTypes } from '@octokit/rest';
import fs from 'fs-extra';
import { cpus } from 'os';
import pAll from 'p-all';
import { dirname } from 'path';
import { AbstractGithubBackup, Repository } from '../protocol';

export class GithubIssueBackup extends AbstractGithubBackup {

    async backup() {
        const repos = await this.octokit.repos.listForOrg({
            org: this.options.org
        });

        await pAll(
            repos.data.map(repo => {
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

        const issues: RestEndpointMethodTypes["issues"]["listForRepo"]["response"] = await this.octokit.issues.listForRepo({
            owner: this.options.org,
            repo: repoName,
        });

        await pAll(
            issues.data.filter(x => !x.pull_request).map(issue => {
                return async () => {

                    const org = this.options.org;
                    const { data: comments } = await this.octokit.issues.listComments({
                        owner: org,
                        repo: repoName,
                        issue_number: issue.number,
                    })

                    const data = { ...issue, extra: { comments } }
                    const issuePath = this.getIssuePath(repoName, issue.number)

                    await fs.ensureDir(dirname(issuePath))
                    await fs.writeJson(issuePath, data);
                }
            }), {
            concurrency: cpus().length,
        })
    }

}