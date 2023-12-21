import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { join } from "path";
import fetch from 'node-fetch';
import { Repo } from "../state";

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
<<<<<<< HEAD

    /**
     * 
     * @description 备份指定的仓库
     * @default []
     * @type {string[]}
     * @memberof GithubBackupOptions
     */
    repos?: string[];
=======
>>>>>>> release
}

export type Repository = RestEndpointMethodTypes["repos"]["listForOrg"]["response"]['data'][0];


export abstract class AbstractGithubBackup {

    readonly options: GithubBackupOptions;
    readonly octokit: Octokit;

    private repos: Repo[] = [];

    abstract backup(): Promise<void>;
    abstract backupRepository(repoName: string): Promise<void>;

    constructor(options: GithubBackupOptions) {
        this.options = {
            ...options,
            dir: options.dir || process.cwd(),
        };
        this.octokit = new Octokit({
            auth: this.options.token, // 请替换为你的个人访问令牌
            request: {
                fetch
            }
        });
    }

    async listForOrg(): Promise<Repo[]> {
        if (this.repos.length) {
            return this.repos;
        }

        const data = await this.octokit.paginate(this.octokit.repos.listForOrg, {
            org: this.options.org,
            per_page: 100, // 每页返回的仓库数量，最大为 100
            type: "all"
        });

<<<<<<< HEAD
        // 注意此处过滤一下
        this.repos = data.filter(x => {
            if (!this.options.repos.length) {
                return true;
            }
            return this.options.repos.includes(x.name);
        });
=======
        this.repos = data;
>>>>>>> release

        return this.repos;
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