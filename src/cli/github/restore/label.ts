import { AbstractGithubRestore } from "../protocol";

export class GithubLabelRestore extends AbstractGithubRestore {
    async restore() {
        console.log(`run ${this.constructor.name} invoke`);
        return null;
    }
}