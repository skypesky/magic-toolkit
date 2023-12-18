import { AbstractGithubRestore } from "../protocol";

export class GithubSettingsRestore extends AbstractGithubRestore {
    async restore() {
        console.log(`run ${this.constructor.name} invoke`);
        return null;
    }
}