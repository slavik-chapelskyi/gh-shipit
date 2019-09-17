const path = require('path');
const debug = require('debug')(`${require('../../package').name}:${path.basename(__filename)}`);
const {getClient} = require('../client');

module.exports.publishDraftRelease = async function({org, repo, releaseId}) {
  const gh = getClient();

  const {data} = await gh.repos.updateRelease({
    owner: org,
    repo,
    release_id: releaseId,
    draft: false
  });

  return data;
};

module.exports.mergePR = async function({org, repo, number}) {
  const gh = getClient();

  debug('Merging PR', {org, repo, number});

  const {data} = await gh.pullRequests.merge({
    owner: org,
    repo,
    number
  });

  return data;
};

module.exports.deleteBranch = async function({org, repo, name}) {
  const gh = getClient();

  debug(`Deleting release branch`);

  try {
    const {data} = await gh.gitdata.deleteRef({owner: org, repo, ref: `heads/${name}`});

    return data;
  } catch (error) {
    debug(
      `Error deleting branch, possibly branch auto-delete feature is enabled in the repo settings`,
      error
    );
  }
};
