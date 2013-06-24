///////////////////////////////////////////////////
//   Initializes the "Model" to hold game data   //
///////////////////////////////////////////////////
///////////////////////////////////////////////////

var SWEEPER=SWEEPER || {}; //prevents errors if scripts loaded out of order
SWEEPER.model=(function($S){
	/////////////////////////////////////
	//	Defaults                       //
	/////////////////////////////////////
	var boardSize=8; //8x8 grid
	var numOfMines=10; //total number of mines
	var mineLocations; //array of mine locations
	var score=250; //current player score
	var scalingRatio=1; //number to scale mouse detection ranges
	var flagsSet=0; //Number of flags placed
	var timerSeconds=0; //eplapsed secodns for the current game
	var hasWon=false; //has the user won the game?


	/////////////////////////////////////
	//	Getters                        //
	/////////////////////////////////////
	var getBoardSize=function(){
		return boardSize;
	};
	var getFlagsSet=function(){
		return flagsSet;
	};
	var getHasWon=function(){
		return hasWon;
	};
	var getMineLocations=function(){
		return mineLocations;
	};
	var getNumOfMines=function(){
		return numOfMines;
	};
	var getScalingRatio=function(){
		return scalingRatio;
	};
	var getScore=function(){
		return score;
	};
	var getTimer=function(){
		var theSecs=timerSeconds;
		var minutes=0;
		var seconds=0;
		if(theSecs>=60){
			minutes=Math.floor(theSecs/60);
		}
		seconds=theSecs-(minutes*60);
		if(seconds<10){
			seconds="0"+seconds;
		}
		return minutes+":"+seconds;
	};
	var getTimerSeconds=function(){
		return timerSeconds;
	};


	/////////////////////////////////////
	//	Setters                        //
	/////////////////////////////////////
	var setBoardSize=function(size){
		switch(size){
			case "large":
				boardSize=32;
				numOfMines=160;
				score=1000;
				break;
			case "medium":
				boardSize=16;
				numOfMines=40;
				score=500;
				break;
			default:
				boardSize=8;
				numOfMines=10;
				score=250;
		}
		timerSeconds=0;
		flagsSet=0;
		hasWon=false;
	};
	var setMineLocations=function(locationsArray){
		if(locationsArray.length!=boardSize){
			return false;
		}
		for(var i=0;i<boardSize;i++){
			if(locationsArray[i].length!=boardSize){
				return false;
			}
		}
		mineLocations=locationsArray;

		return true;
	};
	var setScaleRatio=function(newRatio){
		if(isNaN(newRatio)){
			return;
		}
		scalingRatio=newRatio;
	};



	/////////////////////////////////////
	//	Miscellanious funcitons        //
	/////////////////////////////////////
	//
	//Increase the timer by one second
	var incrementTimer=function(){
		timerSeconds++;
		if(timerSeconds%5 === 0){
			score-=10;
		}
	};

	//Determines if a player has won, ends timer, etc.
	var checkWin=function(){
		if(flagsSet!=numOfMines){
			return false;
		}

		var tilesArray=getMineLocations();
		for(var i=0;i<getBoardSize();i++){
			for(var j=0;j<getBoardSize();j++){
				if(tilesArray[i][j].getIsFlagged()===true && tilesArray[i][j].getHasMine()===false){
					return false;
				}
			}
		}
		hasWon=true;
		$S.controller.stopTimer();
		$S.view.gameOver();
		return true;
	};

	// Takes an object of saved game data and restores it
	var loadBoardInfo=function(boardInfoObj){
		switch(boardInfoObj.size){
			case 32:
				setBoardSize("large");
				break;
			case 16:
				setBoardSize("medium");
				break;
			default:
				setBoardSize("small");
		}
		timerSeconds=boardInfoObj.timerSeconds;
		score=boardInfoObj.score;
	};




	/////////////////////////////////////
	//	Classes                        //
	/////////////////////////////////////

	//Tile Class
	var Tile=function(){
		///-----------///
		///	DEFAULTS  ///
		///-----------///
		var position;
		var hasMine=false;
		var bgColor1="#555";
		var bgColor2="#888";
		var isFlagged=false;
		var isQMed=false;
		var isHovered=false;
		var isUncovered=false;
		var exploded=false;
		var neighborMineCount=0;



		///--------------///
		///	MISC METHODS ///
		///--------------///

		// Gives the tile a mine
		this.addMine=function(){
			hasMine=true;
		};

		// Displays bomb when user clicks "cheat"
		this.cheatFlag=function(){
			if(isFlagged===false){
				flagsSet++;
				isFlagged=true;
				this.magicDig();
				score-=100;
				checkWin();
				return true;
			}
			return false;
		};

		// Determine if tile is currently hovered by mouse
		this.checkHover=function(mouseX,mouseY){
			if(typeof position==="undefined"){
				return false;
			}

			//Adjust for scaling
			var size=position.size*scalingRatio;
			var left=position.left*scalingRatio;
			var top=position.top*scalingRatio;

			if(
				size-(mouseX-left)>0 &&
				mouseX>left &&
				size-(mouseY-top)>0 &&
				mouseY>top
			){
				isHovered=true;
				bgColor1="#777";
				bgColor2="#AAA";
			}else{
				isHovered=false;
				bgColor1="#555";
				bgColor2="#888";
			}
			return true;
		};

		//returns true if tile is uncovered
		this.checkUncovered=function(){
			if(isUncovered===true){
				return true;
			}
			return false;
		};

		//check for click with shovel
		this.dig=function(ignoreHover){
			if(typeof ignoreHover==="undefined"){
				ignoreHover=false;
			}

			if(isFlagged===true){
				return false;
			}

			if(ignoreHover===true){
				if(hasMine===false){
					isUncovered=true;
					return true;
				}
				return false;
			}

			if(isHovered===true){
				if(hasMine===true){
					exploded=true;
					isUncovered=true;
				}else{
					isUncovered=true;
				}
				return true;
			}
			return false;
		};

		//used to count the number of mines surrounding the tile
		this.incrementNeighborMineCount=function(){
			neighborMineCount++;
		};

		// Loads saved tile data
		this.loadInfo=function(infoObj){
			isFlagged=infoObj.isFlagged;
			position=infoObj.position;
			hasMine=infoObj.hasMine;
			isQMed=infoObj.isQMed;
			isUncovered=infoObj.isUncovered;
			neighborMineCount=infoObj.neighborMineCount;
		};

		//uncover tile with no restrictions
		this.magicDig=function(){
			isUncovered=true;
		};



		///---------///
		///	SETTERS ///
		///---------///
		//check for click to set flag
		this.setFlag=function(){
			if(isHovered===true){
				if(isFlagged===false){
					flagsSet++;
					isFlagged=true;
					checkWin();
				}else{
					flagsSet--;
					isFlagged=false;
				}
				return true;
			}
			return false;
		};

		this.setQMark=function(){
			if(isHovered===true){
				if(isQMed===false){
					isQMed=true;
				}else{
					isQMed=false;
				}
				return true;
			}
			return false;
		};
		this.setPosition=function(newPosition){
			position=newPosition;
		};



		///---------///
		///	GETTERS ///
		///---------///
		this.getBgColors=function(){
			return {
				c1:bgColor1,
				c2:bgColor2
			};
		};
		this.getNeighborMineCount=function(){
			return neighborMineCount;
		};
		this.getHasMine=function(){
			return hasMine;
		};
		this.getExploded=function(){
			return exploded;
		};
		this.getIsFlagged=function(){
			return isFlagged;
		};
		this.getIsQMed=function(){
			return isQMed;
		};
		this.getPosition=function(){
			return position;
		};
	};

	//public methods are returned
	return {
		getBoardSize:getBoardSize,
		getFlagsSet:getFlagsSet,
		getHasWon:getHasWon,
		getMineLocations:getMineLocations,
		getNumOfMines:getNumOfMines,
		getScalingRatio:getScalingRatio,
		getScore:getScore,
		getTimer:getTimer,
		getTimerSeconds:getTimerSeconds,
		incrementTimer:incrementTimer,
		loadBoardInfo:loadBoardInfo,
		setBoardSize:setBoardSize,
		setMineLocations:setMineLocations,
		setScaleRatio:setScaleRatio,
		Tile:Tile
	};
}(SWEEPER));