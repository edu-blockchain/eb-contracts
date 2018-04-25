/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0 */
const Alerter = artifacts.require('../contracts/Recorder.sol');
const expectThrow = require('./helpers/expectThrow.js');
const BigNumber = require('bignumber.js');
const testData = require('./fixtures/test_data.json');

const should = require('chai') // eslint-disable-line no-unused-vars
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('Recorder', (accounts) => {
  const creator = accounts[0];
  const owner = accounts[1];
  const admin = accounts[2];
  const amount = new web3.BigNumber(web3.toWei(0.0001, 'ether'));

  before(async () => {
  });

  beforeEach(async () => {
  });

  context('grade recording', () => {
    it('should record grades', async () => {
      // here
    });
  });
});
