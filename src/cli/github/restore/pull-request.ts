import { AbstractGithubRestore } from "../protocol";

export class GithubPullRequestRestore extends AbstractGithubRestore {
    async restore() {
        console.log(`run ${this.constructor.name} invoke`);
        return null;
    }
}