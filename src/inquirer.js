const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const _ = require('lodash');
const logSymbols = require('log-symbols');
const ProgressBar = require('progress');
const getCliWidth = require('cli-width');
const {getBranchDiff} = require('./repos');
const {getUserOrgs} = require('./client-users');
const {getOrgRepos} = require('./client-repos');
const {formatReposDiffsForChoices} = require('./format');
const {getAllReposDiffs} = require('./diff');

module.exports.askOrg = async function() {
  if (process.env.GH_SHIPIT_ORG) {
    return process.env.GH_SHIPIT_ORG;
  }

  const {org} = await inquirer.prompt([
    {
      type: 'list',
      name: 'org',
      message: 'Organization?',
      choices() {
        return getUserOrgs();
      }
    }
  ]);

  return org;
};

module.exports.askRepo = async function(org) {
  const repos = await loadRepos(org);
  const choices = await loadDiffsChoices({org, repos});

  if (_.isEmpty(choices)) {
    console.log(logSymbols.success, `Nothing to Release!`);
    return process.exit(0);
  }

  const {repo} = await inquirer.prompt([
    {
      type: 'list',
      name: 'repo',
      message: 'Repository?',
      pageSize: choices.length,
      choices
    }
  ]);

  return repo;
};

module.exports.askRepoAction = async function({org, repo}) {
  const choices = [];
  const {ahead_by, lastDraftReleaseTag} = await getBranchDiff({org, repo});

  if (ahead_by > 0) {
    const prepareReleaseActionDescription = chalk`{dim ${_.padStart(
      '(creates a release branch, PR, release notes draft)',
      getCliWidth() - 24
    )}}`;

    choices.push({
      name: `Prepare release ${prepareReleaseActionDescription}`,
      value: 'prepare-release'
    });
  }

  if (lastDraftReleaseTag !== '-') {
    choices.push({
      name: `Publish release ${lastDraftReleaseTag}`,
      value: 'publish-release'
    });
  }

  const {action} = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Action?',
      choices
    }
  ]);

  return action;
};

module.exports.askOrgAction = async function() {
  const {action} = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Action?',
      choices: [
        {
          name: 'Create/Publish Releases & PRs',
          value: 'releases'
        },
        {
          name: 'View Latest Releases',
          value: 'view-releases'
        }
      ]
    }
  ]);

  return action;
};

module.exports.askFormatOutput = async function() {
  const {format} = await inquirer.prompt([
    {
      type: 'list',
      name: 'format',
      message: 'Format?',
      choices: [
        {
          name: 'Table',
          value: 'table'
        },
        {
          name: 'CSV',
          value: 'csv'
        }
      ]
    }
  ]);

  return format;
};

async function loadRepos(org) {
  const reposSpinner = ora('Loading Repos').start();

  const repos = await getOrgRepos(org);
  reposSpinner.stop();

  return repos;
}

async function loadDiffsChoices({org, repos}) {
  const bar = new ProgressBar('Calculating Difference [:bar] :percent   ', {
    total: repos.length,
    clear: true,
    width: getCliWidth()
  });

  const diffs = await getAllReposDiffs({org, repos}).onProgress(() => {
    bar.tick(1);
  });

  return formatReposDiffsForChoices(diffs);
}
