// global variables
window.COLOR_RED = "#ea2220";
window.COLOR_RED_HEX = "0xea2220";
window.COLOR_GREEN = "#3db36e";
window.COLOR_GREEN_HEX = '0x3db36e';
window.IMG_PATH = './img/assets/0.5x/';
window.BG_IMG_WIDTH = 1920;
window.BG_IMG_HEIGHT = 1080;

//
var $ = require('jquery');
var PIXI = require('pixi.js');

const app = new PIXI.Application({ width:275, height:206, transparent:true });
document.getElementById('santa-invaders').appendChild(app.view);

const windowWidth = $(window).width();
const windowHeight = $(window).height();
const invaderSize = app.renderer.width / 12;
const bunkerSize = app.renderer.width / 9;
const playerSize = app.renderer.width / 12;

const invaderY = invaderSize;
const bunkerY = (invaderSize*4)+40;

if(windowWidth > windowHeight){
  const resizeRatio = $(window).width() / BG_IMG_WIDTH; 
}else{
  const resizeRatio = $(window).height() / BG_IMG_HEIGHT; 
}
// console.log(resizeRatio)

var invaders = [];
var bunkers = [];
var player = undefined;

var playerSpeed = 10;

var playerBullets = [];
var invaderBullets = [];

var invadersContainer = undefined;
// refernce to loaded resources...
var loadedResources = undefined;
var PLAY_STATE = false;
var GAME_INITIALIZED = false;
var ASSETS_LOADED = true;




function loadAssets(){
  var loader = new PIXI.loaders.Loader();
  // load the characters
  loader.add('invader', IMG_PATH+'Invader@0.5x.png');
  loader.add('bunker', IMG_PATH+'Bunker@0.5x.png');
  loader.add('player', IMG_PATH+'Player@0.5x.png');
  // the explosion animations
  loader.add('./img/assets/invaderExplosion.json');
  loader.add('./img/assets/playerExplosion.json');

  loader.load((loader, resources) => {
    loadedResources = resources;
    showStartScreen();
  });
}




function initInvaders(){
  var rows = 3, cols = 6, x=0, y=invaderY;

  invadersContainer = new PIXI.Container();
  invadersContainer.x = 0;
  app.stage.addChild(invadersContainer);

  // loop starts at 1 so that the modulus calculation works..
  for(var i=1; i<rows*cols+1; i++){
    var invader = new PIXI.Sprite(loadedResources.invader.texture);
    invader.width = invaderSize;
    invader.height = invaderSize;
    invader.x = x;
    invader.y = y;

    if((i % cols) == 0){
      x = 0;
      y += invader.width + 10; 
    }else{
      x += invader.width + 10;
    }

    invadersContainer.addChild(invader);
    invaders.push(invader);
  }

}



function initBunkers(){
  // center the bunker...
  var bunkerOffsetX = (app.renderer.width-(((bunkerSize+40)*3)-40))/2;
  var x=0, y=0;
  // loop starts at 1 so that the modulus calculation works..
  for(var i=0; i<3; i++){
    var bunker = new PIXI.Sprite(loadedResources.bunker.texture);
    bunker.width = bunkerSize;
    bunker.height = bunker.width;
    bunker.x = bunkerOffsetX+((bunkerSize+40)*i);
    bunker.y = bunkerY;
    app.stage.addChild(bunker);
    bunkers.push(bunker);
  }
}




function initPlayer(){
  player = new PIXI.Sprite(loadedResources.player.texture);
  player.width = playerSize;
  player.height = playerSize;
  player.x = (app.renderer.width/2)-(player.width/2);
  player.y = bunkerY + playerSize + 10;
  app.stage.addChild(player);
}

function playerMove(dir){
  if(dir=='left'){
    player.x -= playerSpeed;
    if(player.x < 0) player.x = 0;
  }else{
    player.x += playerSpeed;
    if(player.x > app.renderer.width-player.width) player.x = app.renderer.width-player.width;
  }
}






function playerShoot(){
  // TODO: possibly just init like 10 bullets and pool them..
  var thickness = playerSize/20;
  var bullet = new PIXI.Graphics();
  bullet.lineStyle(thickness, COLOR_GREEN_HEX);
  bullet.moveTo(0,0);
  bullet.lineTo(0,thickness*4);
  bullet.x = Math.round(player.x+(playerSize/2));
  bullet.y = Math.round(player.y);
  app.stage.addChild(bullet);
  playerBullets.push(bullet);
}




function invaderShoot(){
  // TODO: possibly just init like 10 bullets and pool them..
  var thickness = playerSize/20;
  var bullet = new PIXI.Graphics();
  var invader = invaders[Math.floor(Math.random()*invaders.length)];
  bullet.lineStyle(thickness, COLOR_RED_HEX);
  bullet.moveTo(0,0);
  bullet.lineTo(0,thickness*4);
  bullet.x = Math.round(invadersContainer.x + (invader.x+(playerSize/2)));
  bullet.y = Math.round(invader.y);
  app.stage.addChild(bullet);
  invaderBullets.push(bullet);
}




function hitTest(a, b){
  var ab = a.getBounds();
  var bb = b.getBounds();
  return ab.x + ab.width > bb.x && ab.x < bb.x + bb.width && ab.y + ab.height > bb.y && ab.y < bb.y + bb.height;
}




function hitInvader(bullet, invader){
  // play the explosion animation
  var sequence = [];
  for (var i=1; i<=7; i++){
    var frame = PIXI.Texture.fromFrame('IvaderExplosion'+i+'@0.5x.png')
    sequence.push(frame);
  }
  var explosion = new PIXI.extras.AnimatedSprite(sequence);
  explosion.x = invader.x - (invaderSize*1.5);
  explosion.y = invader.y - (invaderSize*1.5);
  explosion.width = invaderSize*4;
  explosion.height = invaderSize*4;
  explosion.animationSpeed = 0.2;
  explosion.loop = false;
  explosion.autoUpdate = true;
  invadersContainer.addChild(explosion);
  // remove on complete and play
  explosion.onComplete = function(){ invadersContainer.removeChild(this); }
  explosion.play();
  // remove the invader and bullet...
  app.stage.removeChild(bullet);
  invadersContainer.removeChild(invader);
}


function hitPlayer(bullet, player){
  // play the explosion animation
  if(PLAY_STATE){
    PLAY_STATE = false;
    var sequence = [];
    for (var i=1; i<=6; i++){
      var frame = PIXI.Texture.fromFrame('PlayerExplosion'+i+'@0.5x.png')
      sequence.push(frame);
    }
    var explosion = new PIXI.extras.AnimatedSprite(sequence);
    explosion.x = player.x - (playerSize*1.5);
    explosion.y = player.y - (playerSize*1.5);
    explosion.width = playerSize*4;
    explosion.height = playerSize*4;
    explosion.animationSpeed = 0.2;
    explosion.loop = false;
    explosion.autoUpdate = true;
    app.stage.addChild(explosion);
    // remove on complete and play
    explosion.onComplete = function(){ app.stage.removeChild(this); }
    explosion.play();
    // remove the invader and bullet...
    app.stage.removeChild(bullet);
    app.stage.removeChild(player);
    player = null;

    endGame();
  }
}


function hitBunker(bullet, bunker){
  app.stage.removeChild(bullet);
}










function resetGame(){
  for(var i=0; i<bunkers.length; i++){ app.stage.removeChild(bunkers[i]); }
  bunkers = [].concat();

  for(var i=0; i<invaders.length; i++){ invadersContainer.removeChild(invaders[i]); }
  invaders = [].concat();

  for(var i=0; i<invaderBullets.length; i++){ app.stage.removeChild(invaderBullets[i]); }
  invaderBullets = [].concat();

  for(var i=0; i<playerBullets.length; i++){ app.stage.removeChild(playerBullets[i]); }
  playerBullets = [].concat();

  for(var i=0; i<playerBullets.length; i++){ app.stage.removeChild(playerBullets[i]); }
  playerBullets = [].concat();
}


function showStartScreen(){
  // show the start screen...
  $('#start-screen-web').css('display','inline-block');
  $('#start-game').off();
  $('#start-game').on('click', function(){
    $('#start-screen-web').css('display','none');
    startGame();
  });
}


function endGame(){
  // go through and remove all the bullets from stage, etc
  resetGame();
  // show the game over screen...
  $('#game-over-screen').css('display','inline-block');
  $('#reset-game').off();
  $('#reset-game').on('click', function(){
    $('#game-over-screen').css('display','none');
    startGame();
  });
}





function startGame(){
  initInvaders();
  initBunkers();
  initPlayer();

  PLAY_STATE = true;

  $("body").off();
  $("body").on("keydown", function(e){
    var key = e.originalEvent.keyCode;
    switch(key){
      case 37:
      case 65:
        playerMove('left');
        break;
      case 39:
      case 68:
        playerMove('right');
        break;
      case 38:
      case 32:
      case 87:
        playerShoot();
        break;
    }
  });


  // Listen for frame updates

  if(!GAME_INITIALIZED){
    var invadersDirection = 'left';

    app.ticker.add(() => {
      // console.log('hi')

      if(PLAY_STATE){
        // move the invaders...
        if(invadersDirection == 'left'){
          invadersContainer.x += 0.5;
          if(invadersContainer.x > app.renderer.width-invadersContainer.width){
            invadersDirection = 'right';
          }
        }else{
          invadersContainer.x -= 0.5;
          if(invadersContainer.x < 0){
            invadersDirection = 'left';
          }
        }

        // move player bullets up until they strike someone or go off the edge...
        for(var i=0; i<playerBullets.length; i++){
          var bullet = playerBullets[i];
          if(bullet){
            // see if it's hitting the bunkers...
            for(var j=0; j<bunkers.length; j++){
              if(hitTest(bullet, bunkers[j])){
                hitBunker(bullet, bunkers[j]);
                playerBullets.splice(i,1);
                app.stage.removeChild(bullet);
              }
            }
            // see if it hit's an invader
            for(var k=0; k<invaders.length; k++){
              if(hitTest(bullet, invaders[k])){
                hitInvader(bullet, invaders[k]);
                invaders.splice(k,1);
                app.stage.removeChild(invaders);
                playerBullets.splice(i,1);
                app.stage.removeChild(bullet);
              }
            }
            // 
            if(bullet.y > -20){
              bullet.y -= 1; 
            }else{
              playerBullets.splice(i,1);
              app.stage.removeChild(bullet);
            }
          }
        }

        // spawn invader bullets...
        if( Math.round(Math.random()*60) == 1 ) invaderShoot();

        // move invader bullets up until they strike someone or go off the edge...
        for(var i=0; i<invaderBullets.length; i++){
          var bullet = invaderBullets[i];
          if(bullet){
            // see if it's hitting the bunkers...
            for(var j=0; j<bunkers.length; j++){
              if(hitTest(bullet, bunkers[j])){
                hitBunker(bullet, bunkers[j]);
                invaderBullets.splice(i,1);
                app.stage.removeChild(bullet);
              }
            }
            // see if it hit's player
            if(hitTest(bullet, player)){
              hitPlayer(bullet, player);
            }
            // 
            if(bullet.y < app.renderer.height){
              bullet.y += 1; 
            }else{
              invaderBullets.splice(i,1);
              app.stage.removeChild(bullet);
            }
          }
        }

      }

    });

  }

  GAME_INITIALIZED = true;
}


function frameTick(){

}

/// load em up..
loadAssets();



