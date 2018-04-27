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
  const owner = accounts[1];
  const evaluator = accounts[2];

  before(async () => {
    gradeBook = await GradeBook.new();
    await gradeBook.transferOwnership(owner);
  });

  beforeEach(async () => {
  });

  context('grade recording', () => {
    it('should record grades', async () => {
      let studentIndex = 0;
      for (let i in testData) {
        let rec = testData[i];
        let recIndex = parseInt(i);

        // get the student ID or make one
        let studentID = (await gradeBook.getStudentID(rec.id_alumno)).toNumber();
        if (studentID === 0) {
          // This should work in one call, but for whatever reason it doesn't
          // studentID = (await gradeBook.makeStudentID(rec.id_alumno)).toNumber();
          await gradeBook.makeStudentID(rec.id_alumno, { from: evaluator });
          studentID = (await gradeBook.getStudentID(rec.id_alumno)).toNumber();
          studentIndex = 0;
        }
        else {
          studentIndex++;
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

        // check that the number of evaluations by this evaluator is correct
        (await gradeBook.getEvaluationCountByRecorderID(recorderID)).toNumber().should.be.equal(recIndex + 1);

        // check that the number of evaluations for this student is correct
        (await gradeBook.getEvaluationCountByStudentID(studentID)).toNumber().should.be.equal(studentIndex + 1);

        // pull out the evaulation recorded by the three methods
        // and make sure they all match 
        // check all evaluations, via Recorder and via Student ID
        let result0 = await gradeBook.evaluations(recIndex);
        let result1 = await gradeBook.getEvaluationByRecorderID(recorderID, recIndex);
        let result2 = await gradeBook.getEvaluationByStudentID(studentID, studentIndex);
        // Orders are different because ByRecorder and ByStudent don't return the
        // fields they are queried by, and `evaluations` returns all fields
        result0[0].toNumber().should.be.equal(recorderID);
        result2[0].toNumber().should.be.equal(recorderID);
        result0[1].toNumber().should.be.equal(studentID);
        result1[0].toNumber().should.be.equal(studentID);
        result0[2].toNumber().should.be.equal(rec.id_oa);
        result1[1].toNumber().should.be.equal(rec.id_oa);
        result2[1].toNumber().should.be.equal(rec.id_oa);
        result0[3].should.be.bignumber.equal(norm(rec.complejidad_oa));
        result1[2].should.be.bignumber.equal(norm(rec.complejidad_oa));
        result2[2].should.be.bignumber.equal(norm(rec.complejidad_oa));
        result0[4].should.be.bignumber.equal(norm(rec.esfuerzo_oa));
        result1[3].should.be.bignumber.equal(norm(rec.esfuerzo_oa));
        result2[3].should.be.bignumber.equal(norm(rec.esfuerzo_oa));
        result0[5].should.be.bignumber.equal(norm(rec.peso_oa));
        result1[4].should.be.bignumber.equal(norm(rec.peso_oa));
        result2[4].should.be.bignumber.equal(norm(rec.peso_oa));
        result0[6].should.be.bignumber.equal(norm(rec.puntos));
        result1[5].should.be.bignumber.equal(norm(rec.puntos));
        result2[5].should.be.bignumber.equal(norm(rec.puntos));
        result0[7].should.be.bignumber.equal(norm(rec.puntos_pond));
        result1[6].should.be.bignumber.equal(norm(rec.puntos_pond));
        result2[6].should.be.bignumber.equal(norm(rec.puntos_pond));
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
});
