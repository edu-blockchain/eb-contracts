/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0 */
/* eslint no-await-in-loop: 0 */
/* eslint prefer-const: 0 */
const GradeBook = artifacts.require('../contracts/GradeBook.sol');
const expectThrow = require('./helpers/expectThrow.js');
const BigNumber = require('bignumber.js');
const testData = require('./fixtures/test-data.json');

const should = require('chai') // eslint-disable-line no-unused-vars
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

// decimal grade 7.4 becomes 74 (stored as uint8 on chain, max 255)
function norm(decimal) {
  return new web3.BigNumber(decimal * 10);
}

contract('GradeBook', (accounts) => {
  const evaluator = accounts[1];
  var gradeBook; // eslint-disable-line no-var

  before(async () => {
    gradeBook = await GradeBook.new();
  });

  beforeEach(async () => {
  });

  context('grade recording', () => {
    it('should record grades', async () => {
      let studentIndex = 0;
      for (let i in testData) { // eslint-disable-line
        let rec = testData[i];
        let recIndex = parseInt(i); // eslint-disable-line

        // get the student ID or make one
        let studentID = (await gradeBook.getStudentID(rec.id_alumno)).toNumber();
        if (studentID === 0) {
          // This should work in one call, but for whatever reason it doesn't
          // studentID = (await gradeBook.makeStudentID(rec.id_alumno)).toNumber();
          await gradeBook.makeStudentID(rec.id_alumno, { from: evaluator });
          studentID = (await gradeBook.getStudentID(rec.id_alumno)).toNumber();
          studentIndex = 0;
        } else {
          studentIndex += 1;
        }

        (await gradeBook.getStudentCount()).toNumber().should.be.equal(studentID);
        (await gradeBook.getStudentIDText(studentID)).should.be.equal(web3.fromAscii(rec.id_alumno));

        // record the evaluation
        let record = await gradeBook.recordEvaluation(
          studentID, rec.id_oa,
          norm(rec.complejidad_oa),
          norm(rec.esfuerzo_oa),
          norm(rec.peso_oa),
          norm(rec.puntos),
          norm(rec.puntos_pond),
          { from: evaluator }); // eslint-disable-line function-paren-newline

        // There should have been an event emitted, and the data should match
        record.logs[0].event.should.be.equal('EvaluationRecorded');
        record.logs[0].args.studentID.toNumber().should.be.equal(studentID);
        record.logs[0].args.activity.toNumber().should.be.equal(rec.id_oa);
        record.logs[0].args.evaluationID.toNumber().should.be.equal(recIndex);

        // Check the recorder ID created during the recording above
        let recorderID = (await gradeBook.getRecorderID(evaluator)).toNumber();
        (await gradeBook.getRecorderAddress(recorderID)).should.be.equal(evaluator);
        record.logs[0].args.recorderID.toNumber().should.be.equal(recorderID);

        // total number of evaluations should be correct
        (await gradeBook.getEvaluationCount()).toNumber().should.be.equal(recIndex + 1);

        // check that the number of evaluations by this evaluator is correct
        (await gradeBook.getEvaluationCountByRecorderID(recorderID)).toNumber().should.be.equal(recIndex + 1);

        // check that the number of evaluations for this student is correct
        (await gradeBook.getEvaluationCountByStudentID(studentID)).toNumber().should.be.equal(studentIndex + 1);

        // compare the evaluation recorded with the three retrieval methods:
        // all evaluations, via Recorder ID, and via Student ID
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
      await expectThrow(gradeBook.recordEvaluation(999, 0, 0, 0, 0, 0, 0, { from: evaluator }));
    });

    it('should not allow adding the same student twice', async () => {
      await gradeBook.makeStudentID('duplo', { from: evaluator });
      await expectThrow(gradeBook.makeStudentID('duplo', { from: evaluator }));
    });
  });
});
