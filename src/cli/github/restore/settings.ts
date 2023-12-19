import pAll from "p-all";
import { AbstractGithubRestore, SettingsMeta } from "../protocol";
import { readJson } from "fs-extra";
import { cpus } from "os";

export class GithubSettingsRestore extends AbstractGithubRestore {
    async restore() {

        const settingsMetas = await this.findSettingsMetas();

        await pAll(
            settingsMetas.map(x => {
                return async () => {
                    return this.restoreSettings(x);
                }
            }),
            {
                concurrency: cpus().length,
            }
        );

        return null;
    }

    async restoreSettings(settingsMeta: SettingsMeta): Promise<void> {
        const settingsData = await readJson(settingsMeta.path);


        try {
            const currentSettings = await this.octokit.repos.get({
                owner: this.options.org,
                repo: settingsMeta.repoName
            });

            if (currentSettings) {
                return;
            }
        } catch (error) {
            if (error.status === 404) {
                // 如果设置不存在，则创建新的设置
                await this.octokit.repos.createInOrg({
                    owner: this.options.org,
                    repo: settingsMeta.repoName,
                    visibility: 'private',
                    ...settingsData
                });
                console.log('Repository settings created successfully.', {
                    org: this.options.org,
                    repo: settingsMeta.repoName
                });
            } else {
                console.error("Repository settings restore throw error:", error);
            }
        }

    }
}