
import { Low } from 'lowdb/lib';
import { JSONPreset } from 'lowdb/node'
import { join } from 'path';
import prettyMilliseconds from 'pretty-ms';

export interface ReposBackupProgressOptions {

  /**
   * @default process.cwd()
   * @description
   * @type {string}
   * @memberof ProgressOptions
   */
  dir?: string;

  org: string;
}


export interface Repo {
  name: string,
}

export interface Data {
  createdAt: string;
  repos: Array<Repo>;
  count: number;
}

export class ReposBackupProgress {

  readonly options: ReposBackupProgressOptions;

  readonly filename: string;

  private db: Low<Data>;

  constructor(options: ReposBackupProgressOptions) {
    this.options = options;
    this.filename = join(this.options.dir, `.${this.options.org}.json`)
  }

  async init(repos: Repo[]): Promise<void> {
    this.db = await JSONPreset<Data>(this.filename, {
      createdAt: new Date().toISOString(),
      repos: [],
      count: 0,
    });

    if (!this.db.data.repos.length) {
      this.db.data.createdAt = new Date().toISOString();
      this.db.data.repos.push(...repos);
      this.db.data.count = repos.length;
      await this.db.write();
    }
  }

  async add(name: string): Promise<void> {

    await this.db.read();

    const index = this.db.data.repos.findIndex(x => x.name === name);
    if (index === -1) {
      this.db.data.repos.push({
        name: name,
      });
    }

    await this.db.write();
  }

  async delete(name: string): Promise<void> {
    await this.db.read();

    this.db.data.repos = this.db.data.repos.filter(x => x.name !== name);

    await this.db.write();
  }

  async findRemaining(): Promise<Repo[]> {
    await this.db.read();
    return this.db.data.repos;
  }

  async isEmpty(): Promise<boolean> {
    await this.db.read();
    return this.db.data.repos.length === 0;
  }

  async done(): Promise<void> {
    this.db.data.createdAt = new Date().toISOString();
    this.db.data.count = 0;
    await this.db.write();
  }

  async printProgress(data: Record<string, string> = {}): Promise<void> {
    await this.db.read();
    console.log({
      ...data,
      progress: `${(this.db.data.count - this.db.data.repos.length)} / ${this.db.data.count}`,
      duration: prettyMilliseconds(Date.now() - new Date(this.db.data.createdAt).getTime()),
      done: await this.isEmpty(),
    });
  }

}