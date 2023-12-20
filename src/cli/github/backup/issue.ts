import { RestEndpointMethodTypes } from '@octokit/rest';
import fs, { pathExists, readJSON } from 'fs-extra';
import { cpus } from 'os';
import pAll from 'p-all';
import { dirname } from 'path';
import { AbstractGithubBackup } from '../protocol';
import { isEqual } from 'lodash';

export class GithubIssueBackup extends AbstractGithubBackup {

    async backup() {
        const repos = await this.listForOrg();

        await pAll(
            repos.map(repo => {
                return async () => {
                    await this.backupRepository(repo.name);
                }
            }),
            {
                concurrency: cpus().length,
            }
        );
    }

    async listAllIssueForRepo(repoName: string): Promise<RestEndpointMethodTypes["issues"]["listForRepo"]["response"]['data']> {
        const data = await this.octokit.paginate(this.octokit.issues.listForRepo, {
            owner: this.options.org,
            repo: repoName,
            per_page: 100,
            state: 'open',
        })

        return data.filter(d => !d.pull_request);
    }

    async backupRepository(repoName: string): Promise<void> {

        const issues = await this.listAllIssueForRepo(repoName);

        await pAll(
            issues.filter(x => !x.pull_request).map(issue => {
                return async () => {

                    const org = this.options.org;
                    const comments = await this.octokit.paginate(this.octokit.issues.listComments, {
                        owner: org,
                        repo: repoName,
                        issue_number: issue.number,
                        per_page: 100,
                    });

                    const data = { ...issue, extra: { comments } }
                    const issuePath = this.getIssuePath(repoName, issue.number)

                    await fs.ensureDir(dirname(issuePath))

                    if (await pathExists(issuePath)) {
                        const oldContent = await readJSON(issuePath);

                        if (isEqual(oldContent, data)) {
                            return;
                        }
                    }

                    await fs.writeJson(issuePath, data);
                }
            }), {
            concurrency: cpus().length,
        })
    }

}