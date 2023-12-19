import pAll from "p-all";
import { AbstractGithubRestore } from "../protocol";
import simpleGit from "simple-git";
import { cpus } from "os";

export class GithubCodeRestore extends AbstractGithubRestore {
    async restore() {

        const repoMetas = await this.findRepoMeta();

        await pAll(
            repoMetas.map(x => {
                return async () => {
                    return this.restoreRepository(x.repoName);
                }
            }),
            {
                concurrency: cpus().length,
            }
        );

    }

    async restoreRepository(repoName: string): Promise<void> {

        const codeMeta = await this.getCodeMeta(repoName);
        const repoUrl = `https://${this.options.token}@github.com/${this.options.org}/${repoName}.git`;
        const localRepoPath = codeMeta.path;
        const remoteName = 'github';

        try {

            await this.removeRemote(localRepoPath, remoteName);
            // Push to GitHub repository
            await simpleGit(localRepoPath).addRemote(remoteName, repoUrl);
            await simpleGit(localRepoPath).push(['-u', remoteName, '--all']);

            console.log(`Repository '${repoName}' restored to GitHub successfully.`);
        } catch (error) {
            console.error(error)
            console.error('Restore code throw an error', {
                org: this.options.org,
                repoName,
            });
        } finally {
            await this.removeRemote(localRepoPath, remoteName);
        }
    }

    async removeRemote(localRepoPath: string, remoteName: string): Promise<void> {
        if (await this.remoteExists(localRepoPath, remoteName)) {
            await simpleGit(localRepoPath).removeRemote(remoteName);
        }
    }

    async remoteExists(localRepoPath: string, remoteName: string): Promise<boolean> {
        const remotes = await simpleGit(localRepoPath).getRemotes();
        const existGithubRemote = remotes.some(x => x.name === remoteName);

        return existGithubRemote;
    }
}