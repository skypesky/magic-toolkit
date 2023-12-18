import pAll from "p-all";
import { AbstractGithubRestore, LabelMeta } from "../protocol";
import { readJson } from "fs-extra";
import { RestEndpointMethodTypes } from "@octokit/rest";


export type Milestone = RestEndpointMethodTypes["issues"]["createMilestone"]["response"]['data']

export class GithubMilestoneRestore extends AbstractGithubRestore {
    async restore() {

        const milestoneMeta = await this.findMilestoneMeta();

        await pAll(
            milestoneMeta.map(milestoneMeta => {
                return async () => {
                    return this.restoreMilestone(milestoneMeta);
                }
            })
        );

        return null;
    }


    async restoreMilestone(labelMeta: LabelMeta): Promise<void> {

        const milestoneData: Milestone[] = await readJson(labelMeta.path);

        await pAll(
            milestoneData.map(milestone => {
                return async () => {
                    if (!await this.milestoneExists(labelMeta.repoName, milestone.title)) {
                        await this.octokit.issues.createMilestone({
                            owner: this.options.org,
                            repo: labelMeta.repoName,
                            title: milestone.title,
                            description: milestone.description,
                            due_on: milestone.due_on,
                            state: milestone.state
                        });
                    }
                }
            })
        )
    }

    async milestoneExists(repoName: string, milestoneName: string): Promise<boolean> {
        try {
            const milestones = await this.octokit.issues.listMilestones({
                owner: this.options.org,
                repo: repoName,
            });
            const labelExists = milestones.data.some(x => x.title === milestoneName);

            return labelExists;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

}