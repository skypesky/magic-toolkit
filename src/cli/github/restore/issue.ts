import pAll from "p-all";
import { AbstractGithubRestore, IssueMeta } from "../protocol";
import { cpus } from "os";
import { RestEndpointMethodTypes } from "@octokit/rest";
import fs from 'fs-extra';

export type Issue = RestEndpointMethodTypes["issues"]["get"]["response"]['data'];
export type MyIssue = Issue & {
    extra: {
        comments: Array<RestEndpointMethodTypes["issues"]["createComment"]["response"]['data']>
    }
}

export class GithubIssueRestore extends AbstractGithubRestore {
    async restore() {
        return null;
    }

    async restoreRepository(repoName: string): Promise<void> {

        const issuesMetas: IssueMeta[] = await this.findIssueMeta(repoName);
        if (!issuesMetas.length) {
            return;
        }

        await pAll(issuesMetas.map(x => {
            return async () => {
                return this.restoreIssue(x);
            }
        }), {
            concurrency: cpus().length,
        })

    }

    private async restoreIssue(issueMeta: IssueMeta): Promise<void> {

        const issueData: MyIssue = await fs.readJSON(issueMeta.path);

        // 如果创建过了 issue 就不创建了
        const exists = await this.issueExists(issueMeta.repoName, issueData.title);
        if (!exists) {
            const assignees = issueData.assignees.length ? '' : `\r\n\r\n ------- assignees: @${issueData.assignees.map(x => `@${x.login}`).join(',')} -------`;

            await this.octokit.issues.create({
                owner: this.options.org,
                repo: issueMeta.repoName,
                title: issueData.title,
                body: issueData.body + assignees,
                labels: issueData.labels,
            });
        }

        const issue: Issue = await this.getIssue(issueMeta.repoName, issueData.title);
        const { data: comments } = await this.octokit.issues.listComments({
            owner: this.options.org,
            repo: issueMeta.repoName,
            issue_number: issue.number,
        });

        const commentsData = issueData.extra.comments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const user = await this.getCurrentUser();
        for (const comment of commentsData) {
            const exists = comments.find(c => c.body === comment.body);
            if (!exists) {

                const sign = user.login === comment.user.login ? '' : `\r\n\r\n ------- comment by @${comment.user.login} -------`;

                await this.octokit.issues.createComment({
                    owner: this.options.org,
                    repo: issueMeta.repoName,
                    issue_number: issue.number,
                    body: `${comment.body}${sign}`,
                });
            }
        }
    }

    async getIssue(repoName: string, issueTitle: string): Promise<Issue> {
        const existingIssues = await this.octokit.issues.listForRepo({
            owner: this.options.org,
            repo: repoName,
        });

        return existingIssues.data.find(issue => issue.title === issueTitle);
    }

    async issueExists(repoName: string, issueTitle: string): Promise<boolean> {
        try {
            const existingIssues = await this.getIssue(repoName, issueTitle);
            return !!existingIssues;
        } catch (error) {
            console.error(error)
            return false;
        }
    }

}