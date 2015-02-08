#pragma strict
import UnityEngine.UI;

// initial direction of turtle
var startingDirection: Vector3 = Vector3.up;
// whether or not to step throught each action with timer
var debugMode: boolean = false;
// how fast each step takes in debug mode
var debugSpeed: float = 1;
// execute button so we can disable it
var executeButton: Transform;
// start over button so we can enable it
var startOverButton: Transform;
// starting coordinates for the turtle
var startingPlace: Transform;

// Action card panel
private var actionCardPanel: GameObject;
// action cards
var actionCardPrefab: GameObject;

// current forward direction for turtle
private var localForward: Vector3;
private var globalForward: Vector3;
// list of actions for turtle to execute
private var actionList: Array;
// is the turtle currently executing?
private var isExecuting: boolean = false;


// initializes variables
function Start () {
	globalForward = localForward = startingDirection;
	actionList = [];
	actionCardPanel = GameObject.Find("ActionCardPanel");
	if(actionCardPanel == null){
		Debug.LogError("Could not find ActionCardPanel");
	}
}

// creates anonymous method to move forward
function addMoveForward(distance: float){
	addAction( function(){
		var targetPosition: Vector3 = transform.position + (globalForward * distance);
		if(checkIfPosEmpty(targetPosition)){
			transform.Translate (localForward * distance);
		}
	}, "Forward");
}

// checks all obstacles and sees if the given position has one TODO: optimize this
function checkIfPosEmpty(targetPos: Vector3) { 
	var allObstacles: GameObject[] = GameObject.FindGameObjectsWithTag("Obstacle"); 
	for each(var current in allObstacles) 
	{ 
		if(current.transform.position == targetPos){
			Debug.Log(current.transform.position);
			// TODO: broadcast collide message
			return false; 
		}
	} 
	return true; 
}

// adds turn left action
function addTurnLeft(){
	addAction(turn(90), "Left");
}

// adds turn right action
function addTurnRight(){
	addAction(turn(-90), "Right");
}

// creates an anonymous method to turn
private function turn(degrees: float){
	return function(){
		transform.Rotate (Vector3.forward * degrees);
		globalForward = Quaternion.Euler(0, 0, degrees) * globalForward;
	};
}

// add action to list of turtle's actions
private function addAction(fun: Function, actionName){
	actionList.push(fun);
	addActionCard(actionName);
}

// adds action card to action card panel
private function addActionCard(actionName){
	var newCard: GameObject = Instantiate(actionCardPrefab); 
	newCard.transform.SetParent(actionCardPanel.transform, false);
	(newCard.GetComponentInChildren(UI.Text)as Text).text = actionName;
}

// removes all cards from action card panel
function clearActionCardPanel(){
	for (var child : Transform in actionCardPanel.transform){
		Destroy(child.gameObject);
	}
	actionList = [];
}

// calls execute and clears action list
function execute(){
	if(!isExecuting){
		// execute the lists of tasks
		StartCoroutine("executeList");
		// clear list of actions
		//actionList = [];
	}
}
// subroutine to execute list (so that we can use WaitForSeconds)
function executeList(): IEnumerator{
	isExecuting = true;
	executeButton.GetComponent(Button).interactable = false;
	for each(action in actionList){
		if (debugMode){
			 yield WaitForSeconds(debugSpeed);
		}
		(action as function())();
	}
	isExecuting = false; // Figure out how to hide and show a butotn
	startOverButton.GetComponent(Button).interactable = true;
}

// returns turtle to the starting position and direction of the level
function returnToStart(){
	executeButton.GetComponent(Button).interactable = true;
	startOverButton.GetComponent(Button).interactable = false;
	transform.position = startingPlace.transform.position;
	// transform.rotation = Quaternion.LookRotation(new Vector3(0,1,1));
	turn(Vector3.Angle(globalForward,startingDirection))();
	
}