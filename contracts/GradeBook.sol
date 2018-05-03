pragma solidity ^0.4.21;

import "./Ownable.sol";


contract GradeBook is Ownable {

  event EvaluationRecorded(uint indexed recorderID, uint indexed studentID, uint indexed activity, uint evaluationID); 

  // The core evaluation method. The order is important because the optimizer
  // crams together the smaller fields in storage.
  struct Evaluation {
    uint  recorderID;
    uint  studentID;
    uint  activity;
    uint8 complexity;
    uint8 effort;
    uint8 weight;
    uint8 points;
    uint8 weightedPoints;
  }

  modifier onlyValidStudentID(uint studentID) {
    require(studentID <= studentCount);
    _;
  }

  // student IDs mapped to the external unique identifier
  // this is normalized to minimize the size of the evaluations array.
  mapping(bytes => uint) internal studentByID;
  bytes[] internal students;
  uint internal studentCount;

  // recorder IDs mapped to the Ethereum address which recorded them
  // this is normalized to minimize the size of the evaluations array.
  mapping(address => uint) internal recorderByAddress;
  address[] internal recorders;
  uint internal recorderCount;

  // evaluations stored in a public array
  // accessible through the implicit evaluations() function.
  // and mapped from student and recorder
  Evaluation[] public evaluations;
  mapping(uint => uint[]) internal evaluationsByStudentID;
  mapping(uint => uint[]) internal evaluationsByRecorderID;

  // Constructor
  constructor() public {
    studentCount = 0;
    recorderCount = 0;
  }

  // Retrieve the student ID based on the text-based student identifier
  // "zero" means the student is not recorded in the system.
  function getStudentID(bytes idText) public view returns (uint) {
    return studentByID[idText];
  }

  // Retrieve the text-based student identifier based on the student ID
  function getStudentIDText(uint studentID) public view returns (bytes) {
    // studentID is one-based, array is zero-based
    return students[studentID-1];
  }

  // Public function to establish an internal student ID which corresponds
  // to an external student ID (which must be unique).
  function makeStudentID(bytes idText) public returns (uint) {
    // must not already exist
    require(0 == getStudentID(idText));
    students.push(idText);
    studentCount = studentCount + 1;
    studentByID[idText] = studentCount;
    return studentCount;
  }

  // Get the internal recorder ID which corresponds to the Ethereum address
  // of the recorder.
  function getRecorderID(address recorder) public view returns (uint) {
    return recorderByAddress[recorder];
  }

  // get the Ethereum address which corresponds to the internal recorder ID
  function getRecorderAddress(uint recorderID) public view returns (address) {
    // recorderID is one-based, array is zero-based
    return recorders[recorderID-1];
  }

  // Record an evaluation. The only restriction is that the student ID must be valid;
  // otherwise, *anyone* can create an evaluation with any values for any activity,
  // real or imaginary, legit or bogus.
  function recordEvaluation(
    uint studentID,
    uint activity,
    uint8 complexity,
    uint8 effort,
    uint8 weight,
    uint8 points,
    uint8 weightedPoints) public onlyValidStudentID(studentID)
    {

    // look up the Recorder ID. If none exists, assign one.
    uint recorderID = makeRecorderID();

    // Store the evaluation in the public evaluations array
    evaluations.push(Evaluation(
      recorderID,
      studentID,
      activity,
      complexity,
      effort,
      weight,
      points,
      weightedPoints));

    // Add the evaluation to the maps so it can be looked up by the student
    // or by the recoder
    uint evaluationID = evaluations.length - 1;
    evaluationsByRecorderID[recorderID].push(evaluationID);
    evaluationsByStudentID[studentID].push(evaluationID);

    // Send an event for this evaluation
    emit EvaluationRecorded(recorderID, studentID, activity, evaluationID);
  }

  // Retrieve the total number of evaluations
  function getEvaluationCount() public view returns (uint) {
    return evaluations.length;
  }

  // Retrieve the number of evaluations by the recorder
  function getEvaluationCountByRecorderID(uint recorderID) public view returns (uint) {
    return evaluationsByRecorderID[recorderID].length;
  }

  // Retrieve the number of evaluations for the student
  function getEvaluationCountByStudentID(uint studentID) public view returns (uint) {
    return evaluationsByStudentID[studentID].length;
  }

  // Retrieve an evaluation by a recorder at a given zero-based index
  function getEvaluationByRecorderID(uint recorderID, uint index) public view
    returns (uint studentID, uint activity, uint8 complexity, uint8 effort, uint8 weight, uint8 points, uint8 weightedPoints)
  {
    Evaluation storage evalu = evaluations[evaluationsByRecorderID[recorderID][index]];
    return(evalu.studentID, evalu.activity, evalu.complexity, evalu.effort, evalu.weight, evalu.points, evalu.weightedPoints);
  }

  // Retrieve an evaluation for a student at a given zero-based index
  function getEvaluationByStudentID(uint studentID, uint index) public view
    returns (uint recorderID, uint activity, uint8 complexity, uint8 effort, uint8 weight, uint8 points, uint8 weightedPoints)
  {
    Evaluation storage evalu = evaluations[evaluationsByStudentID[studentID][index]];
    return(evalu.recorderID, evalu.activity, evalu.complexity, evalu.effort, evalu.weight, evalu.points, evalu.weightedPoints);
  }

  // Internal function for the generation of a recorder ID. The recorder is the sender
  // of the transaction, is not otherwise modifiable, which is why this is internal only.
  function makeRecorderID() internal returns (uint) {
    uint recorderID = getRecorderID(msg.sender);
    if ( 0 == recorderID ) {
      recorders.push(msg.sender);
      recorderCount = recorderCount + 1;
      recorderByAddress[msg.sender] = recorderCount;
      recorderID = recorderCount;
    }
    return recorderID;
  }
}
