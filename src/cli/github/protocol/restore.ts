import { Octokit } from "@octokit/rest";
import { join } from "path";
import fetch from 'node-fetch';
import FastGlob, { Entry } from 'fast-glob'
import pAll from "p-all";
import { flatten } from "lodash";

export interface RepositoryMeta {
    name: string;
    path: string;
}

export interface IssueMeta extends RepositoryMeta {
    /**
     * @description issue number
     * @type {number}
     * @memberof IssueMeta
     */
    id: number;

    /**
     * @description
     * @type {string}
     * @memberof IssueMeta
     */
    repoName: string;
}

export type PullRequestMeta = IssueMeta;

export interface LabelMeta extends RepositoryMeta {
    repoName: string;
}

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
}

export abstract class AbstractGithubRestore {

    readonly options: GithubRestoreOptions;
    readonly octokit: Octokit;

    abstract restore(): Promise<void>;

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

    getOrgPath(): string {
        return join(this.options.dir, this.options.org);
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
        })
        return entryList;
    }

    getIssuePath(repoName: string, issueNumber: number) {
        return join(this.getRepoPath(repoName), `.meta/issue/${issueNumber}.json`)
    }

    async findIssueMeta(): Promise<IssueMeta[]> {

        const repoMetas = await this.findRepoMeta();
        const results = await pAll(
            repoMetas.map(repoMeta => {
                return async (): Promise<IssueMeta[]> => {
                    const entryListForIssues = await FastGlob.async(`${this.getRepoPath(repoMeta.name)}/.meta/issue/**`, {
                        deep: 1,
                        absolute: true,
                        objectMode: true,
                        onlyFiles: true,
                    });

                    return entryListForIssues.map(entry => {
                        return {
                            ...entry,
                            id: +entry.name.split('.').shift(),
                            repoName: repoMeta.name,
                        }
                    })
                }
            })
        );

        const issueMetas = flatten(results).sort((a, b) => a.id - b.id);

        return issueMetas;
    }

    getPullRequestPath(repoName: string, issueNumber: number) {
        return join(this.getRepoPath(repoName), `.meta/pull/${issueNumber}.json`)
    }

    async findPullRequestMeta(): Promise<IssueMeta[]> {

        const repoMetas = await this.findRepoMeta();
        const results = await pAll(
            repoMetas.map(repoMeta => {
                return async (): Promise<IssueMeta[]> => {
                    const entryListForIssues = await FastGlob.async(`${this.getRepoPath(repoMeta.name)}/.meta/issue/**`, {
                        deep: 1,
                        absolute: true,
                        objectMode: true,
                        onlyFiles: true,
                    });

                    return entryListForIssues.map(entry => {
                        return {
                            ...entry,
                            id: +entry.name.split('.').shift(),
                            repoName: repoMeta.name,
                        }
                    })
                }
            })
        );

        const issueMetas = flatten(results).sort((a, b) => a.id - b.id);

        return issueMetas;
    }

    getCodePath(repoName: string): string {
        return join(this.getRepoPath(repoName), '.meta/source.tar.gz')
    }

    getLabelPath(repoName: string): string {
        return join(this.getRepoPath(repoName), '.meta/label.json')
    }

   async findLabelMeta(): Promise<LabelMeta[]> {
        const entryList: Entry[] = await FastGlob.async(`${this.getOrgPath()}/*/.meta/label.json`, {
            onlyFiles: true,
            absolute: true,
            objectMode: true,
            dot: true,
        })

        return entryList.map(entry => {

            const repoName = entry.path.replaceAll(`${this.getOrgPath()}/`, '').replaceAll('/.meta/label.json', '');

            return {
                ...entry,
                repoName,
            }
        });
    }

    getSettingsPath(repoName: string) {
        return join(this.getRepoPath(repoName), `.meta/settings.json`)
    }
}