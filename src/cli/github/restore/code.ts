import { AbstractGithubRestore } from "../protocol";

export class GithubCodeRestore extends AbstractGithubRestore {
    async restore() {
        console.log(`run ${this.constructor.name} invoke`);
        return null;
    }
}