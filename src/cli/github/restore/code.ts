import pAll from "p-all";
import { AbstractGithubRestore, CodeMeta } from "../protocol";
import simpleGit from "simple-git";

export class GithubCodeRestore extends AbstractGithubRestore {
    async restore() {

        const codeMetas = await this.findCodeMeta();

        await pAll(
            codeMetas.map(x => {
                return async () => {
                    return this.restoreCode(x);
                }
            })
        );

    }

    async restoreCode(codeMeta: CodeMeta): Promise<void> {

        const repoName: string = codeMeta.repoName;
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