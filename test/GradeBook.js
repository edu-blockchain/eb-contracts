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

// decimal grade 7.4 becomes 74 (stored as uint8 on chain)
function norm(decimal) {
  return new web3.BigNumber(decimal * 10);
}

contract('GradeBook', (accounts) => {
  const creator = accounts[0];
  const owner = accounts[1];
  const evaluator = accounts[2];
  const amount = new web3.BigNumber(web3.toWei(0.0001, 'ether'));

  before(async () => {
    gradeBook = await GradeBook.new();
    await gradeBook.transferOwnership(owner);
  });

  beforeEach(async () => {
  });

  context('grade recording', () => {
    it('should record grades', async () => {
      for(let i in testData) {
        let rec = testData[i];
        
        // get the student ID or make one
        let studentID = (await gradeBook.getStudentID(rec.id_alumno)).toNumber();
        if(studentID == 0) {
          // This should work in one call, but for whatever reason it doesn't
          // studentID = (await gradeBook.makeStudentID(rec.id_alumno)).toNumber();
          await gradeBook.makeStudentID(rec.id_alumno, { from: evaluator });
          studentID = (await gradeBook.getStudentID(rec.id_alumno)).toNumber();
        }

        (await gradeBook.getStudentIDText(studentID)).should.be.equal(web3.fromAscii(rec.id_alumno));
        
        // record the evaluation
        await gradeBook.recordEvaluation(studentID, rec.id_oa,
                                         norm(rec.complejidad_oa),
                                         norm(rec.esfuerzo_oa),
                                         norm(rec.peso_oa),
                                         norm(rec.puntos),
                                         norm(rec.puntos_pond), { from: evaluator });

        let recorderID = (await gradeBook.getRecorderID(evaluator)).toNumber();
        (await gradeBook.getRecorderAddress(recorderID)).should.be.equal(evaluator);

        // check that the number of evaluations for this evaluator is correct
        (await gradeBook.getEvaluationCount(recorderID)).toNumber().should.be.equal(parseInt(i)+1);

        // pull out the evaulation recorded and make sure it all matches
        let result = await gradeBook.getEvaluation(recorderID, parseInt(i));
        result[0].toNumber().should.be.equal(studentID);
        result[1].toNumber().should.be.equal(rec.id_oa);
        result[2].should.be.bignumber.equal(norm(rec.complejidad_oa));
        result[3].should.be.bignumber.equal(norm(rec.esfuerzo_oa));
        result[4].should.be.bignumber.equal(norm(rec.peso_oa));
        result[5].should.be.bignumber.equal(norm(rec.puntos));
        result[6].should.be.bignumber.equal(norm(rec.puntos_pond));
      }
    });

    it('should not record grades when the student ID is invalid', async () => {
        await expectThrow( gradeBook.recordEvaluation(999, 0, 0, 0, 0, 0, 0, {from: evaluator}));
    });

    it('should not allow adding the same student twice', async () => {
        await gradeBook.makeStudentID('duplo', { from: evaluator });
        await expectThrow( gradeBook.makeStudentID('duplo', { from: evaluator }));
    });
  });

  context('grade retrieval', () => {
    it('should retrieve all grades for a given student', async () => {
//        await gradeBook.getEvaluationCount();
    });
  });
});
