import pAll from "p-all";
import { AbstractGithubRestore, LabelMeta } from "../protocol";
import { readJson } from "fs-extra";
import { RestEndpointMethodTypes } from "@octokit/rest";
import { cpus } from "os";


export type Label = RestEndpointMethodTypes["issues"]["createLabel"]["response"]['data']

export class GithubLabelRestore extends AbstractGithubRestore {
    async restore() {
        return null;
    }

    async restoreRepository(repoName: string): Promise<void> {

        const labelMeta = await this.getLabelMeta(repoName);
        if (!labelMeta) {
            return;
        }

        const labelsData: Label[] = await readJson(labelMeta.path);

        await pAll(
            labelsData.map(label => {
                return async () => {

                    if (!await this.labelExists(labelMeta.repoName, label.name)) {
                        await this.octokit.issues.createLabel({
                            owner: this.options.org,
                            repo: labelMeta.repoName,
                            name: label.name,
                            color: label.color,
                            description: label.description,
                        });
                    }
                }
            }),
            {
                concurrency: cpus().length,
            }
        )
    }

    async labelExists(repoName: string, labelName: string): Promise<boolean> {
        try {
            const existingLabels = await this.octokit.paginate(this.octokit.issues.listLabelsForRepo, {
                owner: this.options.org,
                repo: repoName,
                per_page: 100,
            });
            const labelExists = existingLabels.some(label => label.name === labelName);

            return labelExists;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

}