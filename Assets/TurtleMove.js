#pragma strict
import UnityEngine.UI;

// initial direction of turtle
var startingDirection: Vector3 = Vector3.up;
// whether or not to step throught each action with timer
var debugMode: boolean = false;
// how long in seconds each step takes in debug mode
var debugSpeed: float = 1;
// execute button so we can disable it
var executeButton: Transform;
// start over button so we can enable it
var startOverButton: Transform;
// starting coordinates for the turtle
var startingPlace: Transform;

// Action card panel
private var actionCardPanel: GameObject;
// Action card scroll rect
private var actionCardScrollRect: GameObject;
// action cards
var actionCardPrefab: GameObject;

// current forward direction for turtle
private var localForward: Vector3;
private var globalForward: Vector3;
// list of actions for turtle to execute
private var actionList: Array;
// list of the action cards
private var actionCardList: Array; // TODO: collapse this and the above array into one
// is the turtle currently executing?
private var isExecuting: boolean = false;
// current step of execution we are on
private var executionStep: int;
// how often the execution scroll updates
private var EXECUTION_UPDATE_DELTA = 5;


// initializes variables
function Start () {
	globalForward = localForward = startingDirection;
	actionList = [];
	actionCardList = [];
	actionCardPanel = GameObject.Find("ActionCardPanel");
	if(actionCardPanel == null){
		Debug.LogError("Could not find ActionCardPanel");
	}
	actionCardScrollRect = GameObject.Find("ActionCardScrollRect");
	if(actionCardScrollRect == null){
		Debug.LogError("Could not find ActionCardScrollRect");
	}
	executionStep = 0;
}

// creates anonymous method to move forward
function addMoveForward(distance: float){
	addAction( 
	function(actionCard: GameObject){
		return function(){
			var targetPosition: Vector3 = transform.position + (globalForward * distance);
			if(checkIfPosEmpty(targetPosition)){
				transform.Translate (localForward * distance);
			}
			actionCard.GetComponent(Button).interactable = false;
			scrollOnce(); // Leaving this out on purpose, it gets jarring to rescroll every time
		};
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
	return function(actionCard: GameObject){
		return function(){
			transform.Rotate (Vector3.forward * degrees);
			globalForward = Quaternion.Euler(0, 0, degrees) * globalForward;
			if(actionCard != null){
				actionCard.GetComponent(Button).interactable = false;
			}
			scrollOnce();
			
		};
	};
}

// add action to list of turtle's actions
private function addAction(fun: Function, actionName){
	var actionCard = addActionCard(actionName);
	actionCardList.push(actionCard);
	actionList.push(fun(actionCard));
}

// adds action card to action card panel
private function addActionCard(actionName){
	var newCard: GameObject = Instantiate(actionCardPrefab); 
	newCard.transform.SetParent(actionCardPanel.transform, false);
	(newCard.GetComponentInChildren(UI.Text)as Text).text = actionName;
	
	// scroll to bottom of action card panel
	scrollToBottom();
	// return reference to card to highlight during execution
	return newCard;
}

// scrolls to top of panel
private function scrollToBottom(){
	actionCardScrollRect.GetComponent(ScrollRect).verticalNormalizedPosition=0;
}

// scrolls to bottom of panel
private function scrollToTop(){
	actionCardScrollRect.GetComponent(ScrollRect).verticalNormalizedPosition=1;
}

private var counter = 0;
// scrolls down one step if necessary
private function scrollOnce(){
	if (counter == EXECUTION_UPDATE_DELTA){
		// if we are at the last step just let it be zero
		var stepDelta = (executionStep == actionCardList.length)? 1.0 : 1.0 /actionCardList.length;
		stepDelta = stepDelta * (executionStep + EXECUTION_UPDATE_DELTA);
		actionCardScrollRect.GetComponent(ScrollRect).verticalNormalizedPosition=1f - stepDelta;
		counter = 0;
	}
	counter ++;
	Debug.Log(stepDelta * executionStep);
}

// removes all cards from action card panel
function clearActionCardPanel(){
	for (var actionCard : GameObject in actionCardList){
		Destroy(actionCard);
	}
	actionCardList = [];
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
	executionStep = 0;
	scrollToTop();
	executeButton.GetComponent(Button).interactable = false;
	for each(action in actionList){
		if (debugMode){
			 yield WaitForSeconds(debugSpeed);			
		}
		(action as function())();
		executionStep++;
	}
	isExecuting = false;
	startOverButton.GetComponent(Button).interactable = true;
}

// returns turtle to the starting position and direction of the level
function returnToStart(){
	// makes all buttons unhighlighted
	for (var actionCard: GameObject in actionCardList){
		actionCard.GetComponent(Button).interactable = true;	
	}
	executeButton.GetComponent(Button).interactable = true;
	startOverButton.GetComponent(Button).interactable = false;
	transform.position = startingPlace.transform.position;
	turn(Vector3.Angle(globalForward,startingDirection))(null)(); // pass in null for the "action card" of this action
	
}