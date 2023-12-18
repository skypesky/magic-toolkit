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
        const issuesMetas: IssueMeta[] = await this.findIssueMeta();
        await pAll(
            issuesMetas.map(issueMeta => {
                return async () => {
                    await this.restoreIssue(issueMeta);
                }
            }), {
            concurrency: cpus().length,
        });

    }

    async restoreIssue(issueMeta: IssueMeta): Promise<void> {
        const issueData: MyIssue = await fs.readJSON(issueMeta.path);
        // 如果创建过了 issue 就不创建了
        const exists = await this.issueExists(issueMeta.repoName, issueData.title);
        if (!exists) {
            await this.octokit.issues.create({
                owner: this.options.org,
                repo: issueMeta.repoName,
                title: issueData.title,
                body: issueData.body,
                labels: issueData.labels,
                // TODO: 可以考虑支持
                // milestone: issue.milestone,
                assignees: issueData.assignees.map(x => x.login)
            })
        }

        const issue: Issue = await this.getIssue(issueMeta.repoName, issueData.title);
        const { data: comments } = await this.octokit.issues.listComments({
            owner: this.options.org,
            repo: issueMeta.repoName,
            issue_number: issue.number,
        });

        const commentsData = issueData.extra.comments;
        await pAll(
            commentsData.map(comment => {
                return async () => {
                    const exists = comments.find(c => c.body === comment.body);
                    if (!exists) {
                        await this.octokit.issues.createComment({
                            owner: this.options.org,
                            repo: issueMeta.repoName,
                            issue_number: issue.number,
                            body: comment.body
                        });
                    }
                }
            }),
            {
                concurrency: cpus().length,
            }
        )

        return null;
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