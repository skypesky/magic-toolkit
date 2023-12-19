import pAll from "p-all";
import { AbstractGithubRestore } from "../protocol";
import { readJson } from "fs-extra";
import { RestEndpointMethodTypes } from "@octokit/rest";
import { cpus } from "os";


export type Milestone = RestEndpointMethodTypes["issues"]["createMilestone"]["response"]['data']

export class GithubMilestoneRestore extends AbstractGithubRestore {
    async restore() {
        return null;
    }

    async restoreRepository(repoName: string): Promise<void> {

        const milestoneMeta = await this.getMilestoneMeta(repoName);
        const milestoneData: Milestone[] = await readJson(repoName);

        await pAll(
            milestoneData.map(milestone => {
                return async () => {
                    if (!await this.milestoneExists(milestoneMeta.repoName, milestone.title)) {
                        await this.octokit.issues.createMilestone({
                            owner: this.options.org,
                            repo: milestoneMeta.repoName,
                            title: milestone.title,
                            description: milestone.description,
                            due_on: milestone.due_on,
                            state: milestone.state
                        });
                    }
                }
            }),
            {
                concurrency: cpus().length,
            }
        )
    }

    async milestoneExists(repoName: string, milestoneName: string): Promise<boolean> {
        try {
            const milestones = await this.octokit.issues.listMilestones({
                owner: this.options.org,
                repo: repoName,
            });
            const exists = milestones.data.some(x => x.title === milestoneName);

            return exists;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

}