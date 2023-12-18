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

        try {
            const localRepoPath = codeMeta.path;

            const remotes = await simpleGit(localRepoPath).getRemotes();
            const existGithubRemote = remotes.some(x => x.name === 'github');

            if (existGithubRemote) {
                await simpleGit(localRepoPath).removeRemote('github');
            }

            // Push to GitHub repository
            await simpleGit(localRepoPath).addRemote('github', repoUrl);
            await simpleGit(localRepoPath).push(['-u', 'github', '--all']);

            console.log(`Repository '${repoName}' restored to GitHub successfully.`);
        } catch (error) {
            console.error(error)
            console.error('Restore code throw an error', {
                org: this.options.org,
                repoName,
            });
        }
    }
}