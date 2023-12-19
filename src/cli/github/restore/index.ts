import pAll from "p-all";
import { AbstractGithubRestore, RepositoryMeta } from "../protocol/restore";
import { GithubCodeRestore } from "./code";
import { GithubIssueRestore } from "./issue";
import { GithubLabelRestore } from "./label";
import { GithubSettingsRestore } from "./settings";
import { GithubMilestoneRestore } from "./milestone";
import { cpus } from "os";

export class GithubRestore extends AbstractGithubRestore {

    async restore(): Promise<void> {
        await this.ensureAllRepositoryCreated();
        await new GithubCodeRestore(this.options).restore();
        await new GithubLabelRestore(this.options).restore();
        await new GithubMilestoneRestore(this.options).restore();
        await new GithubIssueRestore(this.options).restore();
        await new GithubSettingsRestore(this.options).restore();
    }

    async ensureAllRepositoryCreated(): Promise<void> {

        const findRepoMetas = await this.findRepoMeta();

        await pAll(
            findRepoMetas.map(x => {
                return async () => {
                    return this.ensureRepositoryCreated(x);
                }
            }),
            {
                concurrency: cpus().length,
            }
        );

        return null;
    }

    async ensureRepositoryCreated(repoMeta: RepositoryMeta): Promise<void> {
        try {
            const { data: existingRepo } = await this.octokit.repos.get({
                owner: this.options.org,
                repo: repoMeta.name,
            });
            if (!existingRepo) {
                await this.octokit.repos.createInOrg({
                    org: this.options.org,
                    name: repoMeta.name,
                    visibility: 'private'
                });
            }
        } catch (error) {
            if (error.status === 404) {
                // 如果仓库不存在，则创建仓库
                await this.octokit.repos.createInOrg({
                    org: this.options.org,
                    name: repoMeta.name,
                    visibility: 'private'
                });

                console.log(`Repository '${repoMeta.name}' created successfully in the organization '${this.options.org}'.`, {
                    org: this.options.org,
                    name: repoMeta.name,
                });
            } else {
                // 如果发生其他错误，则输出错误信息
                console.error('Error checking or creating repository:', error.message);
                return;
            }
        }
    }
}