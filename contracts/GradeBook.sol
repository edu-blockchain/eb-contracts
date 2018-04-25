pragma solidity ^0.4.21;

import "./Ownable.sol";


contract GradeBook is Ownable {

  event EvaluationRecorded(address indexed recorder, uint indexed studentID, uint indexed activity); 

  struct Evaluation {
    uint  studentID;
    uint  activity;
    uint8 complexity;
    uint8 effort;
    uint8 weight;
    uint8 points;
    uint8 weightedPoints;
  }

//  modifier onlyValidAlertType(uint id) {
//    require(id < alertTypes.length);
//    _;
//  }

  mapping(bytes => uint) internal studentByID;
  bytes[] internal students;
  uint internal studentCount;

  mapping(address => Evaluation[]) internal evaluationsByRecorder;

//  address[] internal recorders;
//  uint internal recorderCount;

  constructor() public {
    studentCount = 0;
 //   recorderCount = 0;
  }

  function getStudentID(bytes idText) public view returns (uint) {
    return studentByID[idText];
  }

  function getStudentIDText(uint studentID) public view returns (bytes) {
    // studentID is one-based, array is zero-based
    return students[studentID-1];
  }

  function recordEvaluation(bytes idText, uint activity, uint8 complexity, uint8 effort, uint8 weight, uint8 points, uint8 weightedPoints) public {
    uint studentID = studentByID[idText];
    if(studentID == 0) {
      students.push(idText);
      studentCount = studentCount + 1;
      studentID = studentCount;
      studentByID[idText] = studentID;
    }

    evaluationsByRecorder[msg.sender].push(Evaluation(studentID, activity, complexity, effort, weight, points, weightedPoints));

    emit EvaluationRecorded(msg.sender, studentID, activity);
  }

  function getEvaluationCount(address recorder) public view returns (uint) {
    return evaluationsByRecorder[recorder].length;
  }

//  function getEvaluation(address recorder, uint index) public view returns (uint, uint, uint8, uint8, uint8, uint8, uint8) {
//    Evaluation storage evalu = evaluationsByRecorder[recorder][index];
//    return(evalu.studentID,
//           evalu.activity,
//           evalu.complexity,
//           evalu.effort,
//           evalu.weight,
//           evalu.points,
//           evalu.weightedPoints);
//  }
}
