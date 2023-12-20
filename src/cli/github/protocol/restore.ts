import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { join } from "path";
import fetch from 'node-fetch';
import FastGlob, { Entry } from 'fast-glob'
import { pathExists } from "fs-extra";

export interface RepositoryMeta {
    repoName: string;
    path: string;
}

export interface IssueMeta extends RepositoryMeta {
    /**
     * @description issue number
     * @type {number}
     * @memberof IssueMeta
     */
    id: number;
}

export type PullRequestMeta = IssueMeta;

export type LabelMeta = RepositoryMeta

export type MilestoneMeta = RepositoryMeta

export type SettingsMeta = RepositoryMeta

export type CodeMeta = RepositoryMeta

export interface GithubRestoreOptions {
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

    /**
     * 
     * @description 还原指定的仓库
     * @default []
     * @type {string[]}
     * @memberof GithubRestoreOptions
     */
    repos?: string[]
}

export type User = RestEndpointMethodTypes["users"]["getAuthenticated"]["response"]['data'];


export abstract class AbstractGithubRestore {

    readonly options: GithubRestoreOptions;
    readonly octokit: Octokit;

    abstract restore(): Promise<void>;
    abstract restoreRepository(repoName: string): Promise<void>;

    constructor(options: GithubRestoreOptions) {
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

    async findRepoMeta(): Promise<RepositoryMeta[]> {
        const entryList: Entry[] = await FastGlob.async(`${this.options.org}/*`, {
            cwd: this.options.dir,
            onlyDirectories: true,
            deep: 1,
            absolute: true,
            objectMode: true,
        });

        return entryList.filter(x => {
            if (!this.options.repos.length) {
                return true;
            }
            return this.options.repos.includes(x.name);
        }).map(x => {
            return {
                ...x,
                repoName: x.name,
            }
        });
    }

    async findIssueMeta(repoName: string): Promise<IssueMeta[]> {
        const entryList = await FastGlob.async(`${this.getRepoPath(repoName)}/issue/**`, {
            deep: 1,
            absolute: true,
            objectMode: true,
            onlyFiles: true,
        });

        return entryList.map(entry => {
            return {
                ...entry,
                id: +entry.name.split('.').shift(),
                repoName: repoName,
            }
        });
    }

    async getCodeMeta(repoName: string): Promise<CodeMeta> {

        const path = join(this.options.dir, this.options.org, repoName, 'source/');

        if (!await pathExists(path)) {
            console.warn('Can not find code path: ' + path);
            return null;
        }

        return {
            path,
            repoName
        };
    }


    async getLabelMeta(repoName: string): Promise<LabelMeta> {

        const path: string = join(this.options.dir, this.options.org, repoName, 'label.json');

        if (!await pathExists(path)) {
            console.warn('Can not find label path: ' + path);
            return null;
        }

        return {
            path,
            repoName
        };
    }

    async getMilestoneMeta(repoName: string): Promise<MilestoneMeta> {
        const path: string = join(this.options.dir, this.options.org, repoName, 'milestone.json');

        if (!await pathExists(path)) {
            console.warn('Can not find milestone path: ' + path);
            return null;
        }

        return {
            path,
            repoName
        };
    }

    async getSettingsMeta(repoName: string): Promise<SettingsMeta> {
        const path: string = join(this.options.dir, this.options.org, repoName, 'settings.json');

        if (!await pathExists(path)) {
            console.warn('Can not find settings path: ' + path);
            return null;
        }

        return {
            path,
            repoName
        };
    }

    async getCurrentUser(): Promise<User> {
        const { data } = await this.octokit.users.getAuthenticated();

        return data;
    }
}