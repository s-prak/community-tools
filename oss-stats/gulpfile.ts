import gulp from 'gulp';
import fs  from 'fs';

import { UpdateLicense, AnchoreSummary } from './src/index'
import { RepoList } from './src/index'
import { UpdateLicenseConfigType } from './src/runner/UpdateLicense';
import { RepoListConfigType } from './src/runner/RepoList';
import { AnchoreSummaryConfigType } from './src/runner/AnchoreSummary';
import { RepoSummaryConfigType } from './src/runner/RepoSummary'
import Dependencies, { DependenciesConfigType } from './src/runner/Dependencies';
import Data from './src/data';
import Contributors, { ContributorsConfigType } from './src/runner/Contributors';
import Commits, { CommitConfigType } from './src/runner/Commits';
import Lines, { LinesConfigType } from './src/runner/Lines';
import skipRepos from './src/runner/UpdateLicense/skipRepos'
import Vulnerabilities, { VulnerabilitiesConfigType } from './src/runner/Vulnerabilities';
import { RepoSummary } from './src'


// Global config
let repos = Data.repos
if (process.env.REPO_LIST_OVERRIDE_PATH) {
  repos = require(process.env.REPO_LIST_OVERRIDE_PATH)
}

/**
 * This gulpfile serves as an entrypoint for each of these tools
 */

gulp.task('anchore-summary', async () => {
  const config: AnchoreSummaryConfigType = {
    pathToAnchoreReports: '/Users/lewisdaly/developer/vessels/mojaloop/stats/tmp/latest',
    outputPath: '/Users/lewisdaly/developer/vessels/mojaloop/stats/tmp/summary.xlsx'
  }

  await AnchoreSummary.run(config)
})

gulp.task('contributors', async () => {
  //Note: this task is prone to getting rate limited by github, so use it spasely
  const config: ContributorsConfigType = {
    repos,
  }
  await Contributors.run(config)
})

gulp.task('commits', async () => {
  const config: CommitConfigType = {
    repos,
  }
  await Commits.run(config)
})

gulp.task('dependencies', async () => {
  const config: DependenciesConfigType = {
    pathToRepos: '/tmp/repos',
    reposToClone: repos
  }
  await Dependencies.run(config)
})

/**
 * @function get-repo-csv
 * @description Gets the list of all Mojaloop Repos as a csv file
 */
gulp.task('get-repo-csv', async () => {
  const options: RepoListConfigType = {
    fields: [
      'name',
      'private',
      'description',
      'archived',
      'forks_count'
    ],
    output: process.env.GET_REPO_PATH || `/tmp/results/mojaloop_repos_${(new Date()).toISOString().slice(0, 10)}.csv`,
    minForkCount: 0,
    skipArchived: true,
    ignore: Data.ignoreList,
    fileFormat: 'csv'
  }
  await RepoList.run(options)
})

/**
 * @function get-repo-json
 * @description Gets the list of all Mojaloop Repos as a json file
 */
gulp.task('get-repo-json', async () => {
  const options: RepoListConfigType = {
    // no fields for json output
    fields: [],
    output: process.env.GET_REPO_PATH || `/tmp/results/repos.json`,
    fileFormat: 'json',
    minForkCount: 0,
    skipArchived: true,
    ignore: Data.ignoreList,
  }
  await RepoList.run(options)
})

gulp.task('lines', async () => {
  const config: LinesConfigType = {
    pathToRepos: '/tmp/repos',
    reposToClone: repos
  }
  await Lines.run(config)
})

gulp.task('repo-summary', async () => {
  const config: RepoSummaryConfigType = {
    reposToSummarize: repos
  }

  await RepoSummary.run(config)
})

/**
 * @function update-license
 * @description Creates a PR to update the License file across all repos. 
 *  Expects all repos to be already cloned in `pathToRepos`
 */
gulp.task('update-license', async () => {
  const newLicenseString = fs.readFileSync('./src/UpdateLicense/NewLicense.md').toString()

  const config: UpdateLicenseConfigType = {
    pathToRepos: '/tmp/repos',
    skipRepos,
    newLicenseString,
    shouldSkipNoChanges: true,
  }

  await UpdateLicense.run(config)
});

gulp.task('vulns', async () => {
  const config: VulnerabilitiesConfigType = {
    repos
  }
  
  // TODO: should init with config...
  const vulns = new Vulnerabilities()

  await vulns.run(config)
})