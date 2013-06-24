///////////////////////////////////////////////////
//   Initializes the "View" to display           //
//    graphical features                         //
///////////////////////////////////////////////////
///////////////////////////////////////////////////

var SWEEPER=SWEEPER || {}; //prevents errors if scripts loaded out of order
SWEEPER.view=(function($S,$){
	/////////////////////////////////////
	//	Defaults                       // 
	/////////////////////////////////////
	var context;
	var canvasHeight=350;
	var canvasWidth=630;
	var boardHeight=canvasHeight-(canvasHeight/10);
	var boardWidth=boardHeight;
	var mouseX=0;
	var mouseY=0;
	var tileSpacing=5;
	var tileSize;
	var mouseClick=false;
	var menuBtns=[];

	var currentCursor=0;
	var cursorImages=["shovel.png","flag.png","question_mark.png"];
	var images={};

	var state="intro";
	var freezePlay=false;



	/////////////////////////////////////
	//	Drawing Functions              //
	/////////////////////////////////////

	// Draws a blank blue gradient canvas
	var clearCanvas=function(){
		context.rect(0,0,canvasWidth,canvasHeight);
		var gradient=context.createLinearGradient(0,0,0,canvasHeight);
		gradient.addColorStop(0,'#59dcf7');
		gradient.addColorStop(1,'#195de5');
		context.fillStyle=gradient;
		context.fill();
	};

	//draws the in-game menu
	var drawGameMenu=function(){
		//Cursor buttons
		for(var i=0;i<menuBtns.length;i++){
			menuBtns[i].checkHover(mouseX,mouseY);
		}

		//"right-click" text
		context.fillStyle = '#333';
		context.font = '20px misproject';
		context.fillText('right-click to cycle cursors', boardWidth+(canvasHeight-boardHeight),120);

		// score value
		context.fillStyle = '#FFF';
		context.font = '25px misproject';
		var scoreWidth=context.measureText('Score:').width+10;
		context.fillText('Score:', boardWidth+(canvasHeight-boardHeight),150);
		context.fillStyle = '#FFF';
		context.font = '25px misproject';
		context.fillText($S.model.getScore(), boardWidth+(canvasHeight-boardHeight)+scoreWidth,150);

		// timer value
		context.fillStyle = '#FFF';
		context.font = '25px misproject';
		var timerWidth=context.measureText('Timer:').width+10;
		context.fillText('Timer:', boardWidth+(canvasHeight-boardHeight),175);
		context.fillStyle = '#FFF';
		context.font = '25px misproject';
		context.fillText($S.model.getTimer(), boardWidth+(canvasHeight-boardHeight)+timerWidth,175);

		//Flags left
		context.fillStyle = '#FFF';
		context.font = '25px misproject';
		var flagWidth=context.measureText('Mines Left:').width+10;
		context.fillText('Mines Left:', boardWidth+(canvasHeight-boardHeight),220);
		context.fillStyle = '#FFF';
		context.font = '25px misproject';
		var minesLeft=$S.model.getNumOfMines()-$S.model.getFlagsSet();
		context.fillText(minesLeft, boardWidth+(canvasHeight-boardHeight)+flagWidth,220);
	};

	//Displays "YOU WON!" message
	var drawMessage=function(){
		if($S.model.getHasWon()===false){
			return;
		}
		context.fillStyle = '#f4f45a';
		context.strokeStyle = '#000';
		context.lineWidth = 1;
		context.font = '80px misproject';
		context.fillText('YOU WON!', (boardWidth+(canvasHeight-boardHeight))*0.2,(boardWidth+(canvasHeight-boardHeight))*0.55);
		context.strokeText('YOU WON!', (boardWidth+(canvasHeight-boardHeight))*0.2,(boardWidth+(canvasHeight-boardHeight))*0.55);
	};


	//draws the tiles
	var drawTiles=function(){
		var tileArray=$S.model.getMineLocations();
		tileSpacing=(Math.round(boardHeight/$S.model.getBoardSize()))/10;
		tileSize=(Math.round(boardHeight/$S.model.getBoardSize()))-tileSpacing;
		for(var i=0;i<$S.model.getBoardSize();i++){
			for(var j=0;j<$S.model.getBoardSize();j++){
				var curTile=tileArray[i][j];

				var tileColors=curTile.getBgColors();

				//determine position values for the current tile
				if(!curTile.checkHover(mouseX,mouseY)){
					var newPos={};
					newPos.left=i*(tileSize+tileSpacing)+((canvasHeight-boardHeight)/2);
					newPos.top=j*(tileSize+tileSpacing)+((canvasHeight-boardHeight)/2);
					newPos.size=tileSize;
					curTile.setPosition(newPos);
				}
				curTile.checkHover(mouseX,mouseY);


				//Make tile w/ gradient
				if(curTile.checkUncovered()===false){
					//If the mouse has been clicked, find the hovered tiled and "dig"
					if(mouseClick===true && freezePlay===false){
						switch(currentCursor){
							case 1:
								curTile.setFlag();
								break;
							case 2:
								curTile.setQMark();
								break;
							default:
								$S.controller.digTile(i,j);
						}
					}

					//Define the tile gradient
					var gradient=context.createLinearGradient(
						i*(tileSize+tileSpacing)+((canvasHeight-boardHeight)/2),
						j*(tileSize+tileSpacing)+((canvasHeight-boardHeight)/2),
						i*(tileSize+tileSpacing)+((canvasHeight-boardHeight)/2)+tileSize,
						j*(tileSize+tileSpacing)+((canvasHeight-boardHeight)/2)+tileSize
					);
					gradient.addColorStop(0,tileColors.c1);   
					gradient.addColorStop(1,tileColors.c2);
					context.fillStyle=gradient;


				}else{
					//Set uncovered tile 
					if(curTile.getExploded()===true){
						context.fillStyle="#D00";
					}else{
						context.fillStyle="#DDD";
					}
				}
				context.fillRect(
					i*(tileSize+tileSpacing)+((canvasHeight-boardHeight)/2),
					j*(tileSize+tileSpacing)+((canvasHeight-boardHeight)/2),
					tileSize,
					tileSize
				);

				//print neighboring mines value
				if(curTile.checkUncovered()===true){
					//Display mine if game over
					if(curTile.getHasMine()){
						var flagX=i*(tileSize+tileSpacing)+((canvasHeight-boardHeight)/2);
						var flagY=j*(tileSize+tileSpacing)+((canvasHeight-boardHeight)/2);

						context.drawImage(
							images.c4,
							flagX+(tileSize/5),
							flagY+(tileSize/6),
							tileSize/1.5,
							tileSize/1.5
						);
					}else{//display numbers
						context.fillStyle = '#22F';
						context.font = tileSize+'px misproject';
						var leftNumPos=(tileSize/2)-(context.measureText(curTile.getNeighborMineCount()).width/2);
						var topNumPos=tileSize*0.8;
						context.fillText(
							curTile.getNeighborMineCount(),
							i*(tileSize+tileSpacing)+((canvasHeight-boardHeight)/2)+leftNumPos,
							j*(tileSize+tileSpacing)+((canvasHeight-boardHeight)/2)+topNumPos
						);
					}
				}else{
					//Display flag if flagged
					if(curTile.getIsFlagged()===true){
						var flagX=i*(tileSize+tileSpacing)+((canvasHeight-boardHeight)/2);
						var flagY=j*(tileSize+tileSpacing)+((canvasHeight-boardHeight)/2);

						context.drawImage(
							images.flag,
							flagX+(tileSize/5),
							flagY+(tileSize/6),
							tileSize/1.5,
							tileSize/1.5
						);

					}else if(curTile.getIsQMed()===true){
						var flagX=i*(tileSize+tileSpacing)+((canvasHeight-boardHeight)/2);
						var flagY=j*(tileSize+tileSpacing)+((canvasHeight-boardHeight)/2);

						context.drawImage(
							images.question_mark,
							flagX+(tileSize/5),
							flagY+(tileSize/6),
							tileSize/1.5,
							tileSize/1.5
						);
					}
				}

			}
		}
	};

	//draw menu
	var drawTitle=function(){
		context.fillStyle = '#FFF';
		context.font = '50px misproject';
		context.fillText('C4 Sifter', boardWidth+(canvasHeight-boardHeight)+15,52);
	};

	//displays the intro menu
	var showIntro=function(){
		context.fillStyle = '#FFF';
		context.font = '100px misproject';
		context.fillText('C4 Sifter', 157,170);
		context.fillStyle = '#DD1';
		context.font = '50px misproject';
		context.fillText('Click to Start', 195,220);
	};

	//Refresh the screen on each frame
	var updateScreen=function(){
		clearCanvas();

		//Determine which state to display
		switch(state){
			case "intro":
				showIntro();
				break;
			case "pregame":
				drawGameMenu();
				drawTitle();
				drawTiles();
				drawMessage();
				break;
			case "game":
				drawGameMenu();
				drawTitle();
				drawTiles();
				drawMessage();
				break;
			default:
				break;
		}
		//reset mouse click value
		mouseClick=false;
	};




	/////////////////////////////////////
	//	Classes                        //
	/////////////////////////////////////

	// Class for clickable menu buttons
	var MenuBtn=function(setLeft,setTop,setHeight,setWidth,text,clickAction){
		var isHovered=false;

		var height=setHeight;
		var width=setWidth;
		var left=setLeft;
		var top=setTop;

		//Creates a rounded rectangle to use as a button
		var drawBtn=function(){
			var cornerSize=10;
			context.beginPath();
			context.moveTo(left+cornerSize,top);
			context.lineTo(left+width,top);
			context.quadraticCurveTo(left+width+cornerSize, top, left+width+cornerSize, top+cornerSize);
			context.lineTo(left+width+cornerSize, top+height);
			context.quadraticCurveTo(left+width+cornerSize, top+height+cornerSize, left+width, top+height+cornerSize);
			context.lineTo(left+cornerSize, top+height+cornerSize);
			context.quadraticCurveTo(left, top+height+cornerSize, left, top+height);
			context.lineTo(left, top+cornerSize);
			context.quadraticCurveTo(left, top, left+cornerSize, top);
			context.strokeStyle="#000;";
			if(isHovered === true){
				context.fillStyle="#f4f45a";
			}else{
				context.fillStyle="#DD1";
			}
			context.stroke();
			context.fill();

			if(typeof text==="string"){
				context.fillStyle = '#333';
				context.font = '30px misproject';
				var leftPos=left+((width/2)-(context.measureText(text).width/2))+4;
				context.fillText(text, leftPos, top+(height*1.2));
			}else{
				context.drawImage(
					text,
					left*1.02,
					top*1.1,
					width*0.8,
					height*0.8
				);
			}
		};

		//Determine if button is currently hovered
		var checkHover=function(mouseX,mouseY){

			var scalingRatio=$S.model.getScalingRatio();

			//Adjust for scaling
			setHeight=(height+10)*scalingRatio;
			setWidth=(width+10)*scalingRatio;
			setLeft=left*scalingRatio;
			setTop=top*scalingRatio;


			if(
				setWidth-(mouseX-setLeft)>0 &&
				mouseX>setLeft &&
				setHeight-(mouseY-setTop)>0 &&
				mouseY>setTop
			){
				if(mouseClick===true){
					clickAction();
				}
				isHovered=true;
			}else{
				isHovered=false;
			}
			drawBtn();
			return true;
		};


		return {
			checkHover:checkHover
		};
	};






	/////////////////////////////////////
	//	Game initialization            //
	/////////////////////////////////////

	//Perform initial preperations for the game
	var intializeCanvas=function(){
		var sweeper_canvas=$('#sweeper_canvas')[0];
		var theHeight=canvasHeight*($('#sweeper_canvas').width()/canvasWidth);

		if(sweeper_canvas.getContext){
			$('#sweeper_canvas').height(theHeight);
			sweeper_canvas.height=canvasHeight;
			sweeper_canvas.width=canvasWidth;
			context=sweeper_canvas.getContext('2d');

			findScalingRatio();

			//Preload resources
			$S.preload.font("misproject");
			images.shovel=$S.preload.image("images/shovel.png");
			images.flag=$S.preload.image("images/flag.png");
			images.question_mark=$S.preload.image("images/question_mark.png");
			images.c4=$S.preload.image("images/c4.png");

			//Make BG gradient
			clearCanvas();
			var refreshInterval=setInterval(updateScreen,20);

			$(sweeper_canvas).mousemove(function(e){
				mouseX=e.pageX-$(this).offset().left;
				mouseY=e.pageY-$(this).offset().top;
			});

		}
	};

	//retrieves the current game "State"
	var getGameState=function(){
		return state;
	};

	//initialize the game once the window and canvas are ready
	$(window).load(function(){
		$("#sweeper_canvas").rightClick(function(e){
			toggleCursor();
		});

		$("#sweeper_canvas").on("click",function(e){
			menuBtns=[];
			menuBtns.push(new MenuBtn(boardWidth+(canvasHeight-boardHeight)-5,60,20,40,"8x8",function(){changeBoardSize("small");}));
			menuBtns.push(new MenuBtn(boardWidth+(canvasHeight-boardHeight)+50,60,20,50,"16x16",function(){changeBoardSize("medium");}));
			menuBtns.push(new MenuBtn(boardWidth+(canvasHeight-boardHeight)+115,60,20,60,"32x32",function(){changeBoardSize("large");}));
			menuBtns.push(new MenuBtn(boardWidth+(canvasHeight-boardHeight)+20,300,20,60,"Load",function(){$S.controller.loadGame();}));
			state="pregame";

			$S.controller.generateBoard();
		});

		intializeCanvas();
	});

	//Fix scaling to allow responsive design
	$(window).resize(function(){
		findScalingRatio();
	});





	/////////////////////////////////////
	//	User input functions           //
	/////////////////////////////////////

	// Handles board size button click
	var changeBoardSize=function(size){
		$S.controller.generateBoard();
		freezePlay=false;
		$S.model.setBoardSize(size);
	};

	//Determine the ratio of canvas size:default size
	var findScalingRatio=function(){
		$S.model.setScaleRatio($("#sweeper_canvas").height()/canvasHeight);
	};

	//ends the game
	var gameOver=function(){
		freezePlay=true;
		menuBtns=[];
		menuBtns.push(new MenuBtn(boardWidth+(canvasHeight-boardHeight)-5,60,20,40,"8x8",function(){changeBoardSize("small");}));
		menuBtns.push(new MenuBtn(boardWidth+(canvasHeight-boardHeight)+50,60,20,50,"16x16",function(){changeBoardSize("medium");}));
		menuBtns.push(new MenuBtn(boardWidth+(canvasHeight-boardHeight)+115,60,20,60,"32x32",function(){changeBoardSize("large");}));
		menuBtns.push(new MenuBtn(boardWidth+(canvasHeight-boardHeight)+20,300,20,60,"Load",function(){$S.controller.loadGame();}));
		state="pregame";
		$S.controller.showMines(0,0);
	};

	//called from controller.generateBoard() once the tile objects have been created.
	var printBoard=function(){
		$("#sweeper_canvas").off("click");
		$("#sweeper_canvas").on("click",function(e){
			mouseClick=true;
		});
	};

	//sets the cursor to specific selection
	var setCursor=function(cursorNum){
		if(isNaN(cursorNum) || cursorNum>=cursorImages.length || cursorNum<0){
			currentCursor=0;
		}
		currentCursor=cursorNum;
		$('canvas').css('cursor','url("images/'+cursorImages[currentCursor]+'") 5 65,default');
	};

	//starts the game timer and other functionality
	var startGame=function(){
		menuBtns=[];
		menuBtns.push(new MenuBtn(boardWidth+(canvasHeight-boardHeight)+20,60,30,30,images.shovel,function(){setCursor(0);}));
		menuBtns.push(new MenuBtn(boardWidth+(canvasHeight-boardHeight)+70,60,30,30,images.flag,function(){setCursor(1);}));
		menuBtns.push(new MenuBtn(boardWidth+(canvasHeight-boardHeight)+120,60,30,30,images.question_mark,function(){setCursor(2);}));


		menuBtns.push(new MenuBtn(boardWidth+(canvasHeight-boardHeight)+20,250,20,60,"Cheat",function(){$S.controller.cheat();}));
		menuBtns.push(new MenuBtn(boardWidth+(canvasHeight-boardHeight)+20,300,20,60,"Save",function(){$S.controller.saveGame();}));
		state="game";
		freezePlay=false;
	};

	//cycles through available cursors
	var toggleCursor=function(){
		currentCursor++;
		if(currentCursor>=cursorImages.length-1){
			currentCursor=0;
		}
		$('canvas').css('cursor','url("images/'+cursorImages[currentCursor]+'") 5 65,default');
	};



	// Public methods are returned
	return {
		getGameState:getGameState,
		printBoard:printBoard,
		startGame:startGame,
		gameOver:gameOver
	};
}(SWEEPER,jQuery));