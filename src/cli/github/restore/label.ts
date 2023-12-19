import pAll from "p-all";
import { AbstractGithubRestore, LabelMeta } from "../protocol";
import { readJson } from "fs-extra";
import { RestEndpointMethodTypes } from "@octokit/rest";
import { cpus } from "os";


export type Label = RestEndpointMethodTypes["issues"]["createLabel"]["response"]['data']

export class GithubLabelRestore extends AbstractGithubRestore {
    async restore() {

        const labelMetas = await this.findLabelMeta();

        await pAll(
            labelMetas.map(labelMeta => {
                return async () => {
                    return this.restoreLabel(labelMeta);
                }
            }),
            {
                concurrency: cpus().length,
            }
        );

        return null;
    }


    async restoreLabel(labelMeta: LabelMeta): Promise<void> {

        const labelsData: Label[] = await readJson(labelMeta.path);

        await pAll(
            labelsData.map(label => {
                return async () => {
                    if (! await this.labelExists(labelMeta.repoName, label.name)) {
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
            const existingLabels = await this.octokit.issues.listLabelsForRepo({
                owner: this.options.org,
                repo: repoName,
            });
            const labelExists = existingLabels.data.some(label => label.name === labelName);

            return labelExists;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

}