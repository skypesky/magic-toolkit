import { RestEndpointMethodTypes } from '@octokit/rest';
import fs from 'fs-extra';
import { cpus } from 'os';
import pAll from 'p-all';
import { dirname } from 'path';
import got from 'got';
import { pipeline } from 'stream/promises';
import { AbstractGithubBackup } from '../protocol';
import { GithubIssueBackup } from './issue';
import { GithubPullRequestBackup } from './pull-request';
import { GithubLabelBackup } from './lable';
import { GithubSettingsBackup } from './settings';
import { GithubCodeBackup } from './code';
import { GithubMilestoneBackup } from './milestone';

export class GithubBackup extends AbstractGithubBackup {

  async backup() {
    const backups: AbstractGithubBackup[] = [
      new GithubCodeBackup(this.options),
      new GithubMilestoneBackup(this.options),
      new GithubLabelBackup(this.options),
      new GithubIssueBackup(this.options),
      new GithubPullRequestBackup(this.options),
      new GithubSettingsBackup(this.options),
    ]

    await Promise.all(
      backups.map(x => x.backup())
    );
  }

}