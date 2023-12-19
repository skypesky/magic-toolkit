import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { join } from "path";
import fetch from 'node-fetch';

export interface GithubBackupOptions {
    // github 组织名称
    org: string;

    // github personal token
    token: string;

    /**
     * @description 
     * @default process.cwd()
     * @type {string}
     * @memberof GithubBackupOptions
     */
    dir?: string;
}

export type Repository = RestEndpointMethodTypes["repos"]["listForOrg"]["response"]['data'][0];


export abstract class AbstractGithubBackup {

    readonly options: GithubBackupOptions;
    readonly octokit: Octokit;

    abstract backup(): Promise<void>;
    abstract backupRepository(repoName: string): Promise<void>;

    constructor(options: GithubBackupOptions) {
        this.options = {
            dir: process.cwd(),
            ...options
        };
        this.octokit = new Octokit({
            auth: this.options.token, // 请替换为你的个人访问令牌
            request: {
                fetch
            }
        });
    }

    getRepoPath(repoName: string): string {
        return join(this.options.dir, this.options.org, repoName);
    }

    getIssuePath(repoName: string, issueNumber: number) {
        return join(this.getRepoPath(repoName), `issue/${issueNumber}.json`)
    }

    getCodePath(repoName: string): string {
        return join(this.getRepoPath(repoName), 'source/')
    }

    getLabelPath(repoName: string): string {
        return join(this.getRepoPath(repoName), 'label.json')
    }

    getMilestonePath(repoName: string): string {
        return join(this.getRepoPath(repoName), 'milestone.json')
    }

    getSettingsPath(repoName: string) {
        return join(this.getRepoPath(repoName), `settings.json`)
    }
}