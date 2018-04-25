/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0 */
const GradeBook = artifacts.require('../contracts/GradeBook.sol');
const expectThrow = require('./helpers/expectThrow.js');
const BigNumber = require('bignumber.js');
const testData = require('./fixtures/test-data.json');

const should = require('chai') // eslint-disable-line no-unused-vars
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('GradeBook', (accounts) => {
  const creator = accounts[0];
  const owner = accounts[1];
  const evaluator = accounts[2];
  const amount = new web3.BigNumber(web3.toWei(0.0001, 'ether'));

  let recorder;
  before(async () => {
    gradeBook = await GradeBook.new();
    await gradeBook.transferOwnership(owner);
  });

  beforeEach(async () => {
  });

  context('grade recording', () => {
    it('should record grades', async () => {
      for(var i in testData) {
        var rec = testData[i];
        await gradeBook.recordEvaluation(rec.id_alumno, rec.id_oa, rec.complejidad_oa, rec.esfuerzo_oa, rec.peso_oa, rec.puntos, rec.puntos_pond, { from: evaluator });
        (await gradeBook.getEvaluationCount(evaluator)).toNumber().should.be.equal(parseInt(i)+1);
        var id = (await gradeBook.getStudentID(rec.id_alumno)).toNumber();
        (await gradeBook.getStudentIDText(id)).should.be.equal(web3.fromAscii(rec.id_alumno));
      }
    });
  });
});
