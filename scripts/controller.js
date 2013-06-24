///////////////////////////////////////////////////
//   Initializes the "Controller" to handle      //
//   game functionality                          //
///////////////////////////////////////////////////
///////////////////////////////////////////////////

var SWEEPER=SWEEPER || {}; //prevents errors if scripts loaded out of order
SWEEPER.controller=(function($S){
	var theTimer;


	//Reveals a mine and reduces score
	var cheat=function(){
		var flagsSet=$S.model.getFlagsSet();
		var numMines=$S.model.getNumOfMines();
		if(numMines-flagsSet<=0){
			return;
		}

		var mineFound=false;
		var tileArray=$S.model.getMineLocations();
		while(mineFound===false){
			var mineY=Math.round(Math.random()*( $S.model.getBoardSize()-1 ) );
			var mineX=Math.round(Math.random()*( $S.model.getBoardSize()-1 ) );
			if(tileArray[mineY][mineX].getHasMine()===true){
				if(tileArray[mineY][mineX].cheatFlag()){
					mineFound=true;
				}
			}
		}
	};



	//Digs a tile
	var digTile=function(x,y,ignoreHover){
		if(typeof ignoreHover==="undefined"){
			ignoreHover=false;
		}
		var tileArray=$S.model.getMineLocations();
		var curTile=tileArray[x][y];
		var wasDug=curTile.dig(ignoreHover);

		if($S.view.getGameState()==="pregame" && wasDug===true){
			theTimer=setInterval($S.model.incrementTimer,1000);
			$S.view.startGame();
		}

		if(ignoreHover===false && wasDug===true && curTile.getHasMine()===true){
			stopTimer();
			$S.view.gameOver();
		}


		//If dug and the tile has 0 neighboring mines, dig the surrounding tiles
		if(wasDug===true && curTile.getNeighborMineCount()===0 && curTile.getHasMine()===false){
			for(var ny=y-1; ny<=y+1; ny++){
				if(ny<0 || ny>=$S.model.getBoardSize()){
					continue;
				}
				for(var nx=x-1; nx<=x+1; nx++){
					if(nx<0 || nx>=$S.model.getBoardSize() || (y==ny && x==nx)){
						continue;
					}
					if(tileArray[nx][ny].getHasMine()===false && tileArray[nx][ny].checkUncovered()===false){
						digTile(nx,ny,true);
					}
				}
			}
		}
	};


	// Creates all the tiles and populates with mines
	var generateBoard=function(){
		var tempMineArray=[]; //temporarily hold the new mine locations

		//Clear the board
		for(var i=0;i<$S.model.getBoardSize();i++){
			tempMineArray[i]=[];
			for(var j=0;j<$S.model.getBoardSize();j++){
				tempMineArray[i][j]=new $S.model.Tile();
			}
		}

		//randomly add mines to the board
		var mineCount=0;
		while(mineCount<$S.model.getNumOfMines()){
			var mineY=Math.round(Math.random()*( $S.model.getBoardSize()-1 ) );
			var mineX=Math.round(Math.random()*( $S.model.getBoardSize()-1 ) );
			if(tempMineArray[mineY][mineX].getHasMine()===false){
				tempMineArray[mineY][mineX].addMine();

				//Determine neighboring mines
				for(var ny=mineY-1;ny<=mineY+1;ny++){
					if(ny<0 || ny>=$S.model.getBoardSize()){
						continue;
					}
					for(var nx=mineX-1;nx<=mineX+1;nx++){
						if(nx<0 || nx>=$S.model.getBoardSize() || (mineY==ny && mineX==nx)){
							continue;
						}
						tempMineArray[ny][nx].incrementNeighborMineCount();
					}
				}

				mineCount++;
			}
		}
		$S.model.setMineLocations(tempMineArray);
		$S.view.printBoard();
	};


	//Loads a saved game if one exists
	var loadGame=function(){
		var boardArray=localStorage.getItem("boardInfo");
		var tilesArray=localStorage.getItem("tilesArray");
		if(boardInfo!==null && tilesArray!==null){
			var boardInfo=JSON.parse(boardArray);
			var tilesInfo=JSON.parse(tilesArray);

			$S.model.loadBoardInfo(boardInfo);

			var tempTileArray=[]; //temporarily hold the new mine locations

			//Clear the board
			for(var i=0;i<$S.model.getBoardSize();i++){
				tempTileArray[i]=[];
				for(var j=0;j<$S.model.getBoardSize();j++){
					tempTileArray[i][j]=new $S.model.Tile();
					tempTileArray[i][j].loadInfo(tilesInfo[i][j]);
				}
			}

			$S.model.setMineLocations(tempTileArray);
			$S.view.printBoard();
			
			theTimer=setInterval($S.model.incrementTimer,1000);
			$S.view.startGame();
		}
	};


	//Saves the current game
	var saveGame=function(){
		var tilesArray=$S.model.getMineLocations();
		var storageArray=[];
		for(var i=0;i<tilesArray.length;i++){
			storageArray[i]=[];
			for(var j=0;j<tilesArray[i].length;j++){
				var storeObj={};
				storeObj.isFlagged=tilesArray[i][j].getIsFlagged();
				storeObj.position=tilesArray[i][j].getPosition();
				storeObj.hasMine=tilesArray[i][j].getHasMine();
				storeObj.isQMed=tilesArray[i][j].getIsQMed();
				storeObj.isUncovered=tilesArray[i][j].checkUncovered();
				storeObj.neighborMineCount=tilesArray[i][j].getNeighborMineCount();
				storageArray[i][j]=storeObj;
			}
		}
		var boardInfo={};
		boardInfo.size=$S.model.getBoardSize();
		boardInfo.timerSeconds=$S.model.getTimerSeconds();
		boardInfo.score=$S.model.getScore();


		localStorage.setItem("boardInfo", JSON.stringify(boardInfo));
		localStorage.setItem("tilesArray", JSON.stringify(storageArray));
	};


	//Recursively uncovers all tiles
	var showMines=function(x,y){
		var boardSize=$S.model.getBoardSize();
		var tileArray=$S.model.getMineLocations();
		var curTile=tileArray[x][y];

		//this creates the "animation" effect for uncovering
		var timeit=setTimeout(function(){curTile.magicDig();},x*70+y*30);

		y++;
		if(y>=boardSize){
			x++;
			y=0;
		}
		if(x>=boardSize){
			return;
		}

		showMines(x,y);
	};


	// Stops the game timer
	var stopTimer=function(){
		clearInterval(theTimer);
	};


	//public methods are returned
	return {
		cheat:cheat,
		digTile:digTile,
		generateBoard:generateBoard,
		loadGame:loadGame,
		showMines:showMines,
		saveGame:saveGame,
		stopTimer:stopTimer
	};
}(SWEEPER));