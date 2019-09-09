jest.mock('./client');

const {getClient} = require('./client');
const {getRepoBranches, compareBranches, getOrgRepos} = require('./client-repos');

const getBranchesMock = jest.fn().mockReturnValue({data: [{name: 'develop'}, {name: 'master'}]});
const compareCommitsMock = jest.fn().mockReturnValue({data: []});
const listForOrgMock = jest.fn().mockReturnValue({data: []});
const getBranchMock = jest.fn().mockReturnValue({data: {commit: {sha: 'a1b2c3'}}});

getClient.mockReturnValue({
  repos: {
    getBranches: getBranchesMock,
    compareCommits: compareCommitsMock,
    listForOrg: listForOrgMock,
    getBranch: getBranchMock
  }
});

describe('#getRepoBranches', () => {
  beforeEach(() => {
    getBranchesMock.mockClear();
  });

  it('should export getRepoBranches function', () => {
    expect(getRepoBranches).toBeInstanceOf(Function);
  });

  it('should call getBranches w/ 100 page size', async () => {
    await getRepoBranches({org: 'my-org', repo: 'my-repo'});

    expect(getBranchesMock).toHaveBeenCalledWith({owner: 'my-org', per_page: 100, repo: 'my-repo'});
  });

  it('should return 2 branches', async () => {
    const branches = await getRepoBranches({org: 'my-org', repo: 'my-repo'});

    expect(branches).toEqual(['develop', 'master']);
  });
});

describe('#compareBranches', () => {
  beforeEach(() => {
    compareCommitsMock.mockClear();
  });

  it('should export compareBranches function', () => {
    expect(compareBranches).toBeInstanceOf(Function);
  });

  it('should call compareCommits w/ develop and master', async () => {
    await compareBranches({org: 'my-org', repo: 'my-repo'});

    expect(compareCommitsMock).toHaveBeenCalledWith({
      base: 'master',
      head: 'develop',
      owner: 'my-org',
      repo: 'my-repo'
    });
  });

  it('should return array of changes', async () => {
    const changes = await compareBranches({org: 'my-org', repo: 'my-repo'});

    expect(changes).toEqual([]);
  });
});

describe('#getOrgRepos', () => {
  it('should export getOrgRepos function', () => {
    expect(getOrgRepos).toBeInstanceOf(Function);
  });

  it('should call getForOrg w/ type:sources and size:100', async () => {
    await getOrgRepos('my-org');

    expect(listForOrgMock).toHaveBeenCalledWith({
      org: 'my-org',
      per_page: 100,
      type: 'sources',
      sort: 'pushed',
      direction: 'desc'
    });
  });

  it('should return array of non-archived repos', async () => {
    listForOrgMock.mockReturnValueOnce({
      data: [
        {name: 'repo-1', archived: false},
        {name: 'repo-2', archived: true},
        {name: 'repo-3', archived: false}
      ]
    });
    const repos = await getOrgRepos('my-org');

    expect(repos).toEqual(['repo-1', 'repo-3']);
  });
});
