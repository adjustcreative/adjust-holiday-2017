// global variables
window.COLOR_RED = "#ea2220";
window.COLOR_GREEN = "#3db36e";
window.COLOR_GREEN_HEX = '0x3db36e';
window.IMG_PATH = './img/assets/0.5x/';
//
var $ = require('jquery');
var PIXI = require('pixi.js');

const app = new PIXI.Application({ width:290, height:206, transparent:true });
document.getElementById('santa-invaders').appendChild(app.view);

const invaders = [];
const bunkers = [];
var player = undefined;

const invaderSize = app.renderer.width / 12;
const bunkerSize = app.renderer.width / 9;
const playerSize = app.renderer.width / 12;

const bunkerY = (invaderSize*3)+40;

var playerSpeed = 10;

const playerBullets = [];
const invaderBullets = [];


function loadAssets(){
  // load the texture we need
  var loader = new PIXI.loaders.Loader();
  loader.add('invader', IMG_PATH+'Invader@0.5x.png');
  loader.add('bunker', IMG_PATH+'Bunker@0.5x.png');
  loader.add('player', IMG_PATH+'Player@0.5x.png');

  loader.load((loader, resources) => {
    initInvaders(resources);
    initBunkers(resources);
    initPlayer(resources);

    startGame();
  });
}

function initInvaders(resources){
  var rows = 3, cols = 6, x=0, y=0;
  // loop starts at 1 so that the modulus calculation works..
  for(var i=1; i<rows*cols+1; i++){
    var invader = new PIXI.Sprite(resources.invader.texture);
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

    app.stage.addChild(invader);
    invaders.push(invader);
  }
}

function initBunkers(resources){
  var x=0, y=0;
  // loop starts at 1 so that the modulus calculation works..
  for(var i=0; i<3; i++){
    var bunker = new PIXI.Sprite(resources.bunker.texture);
    bunker.width = app.renderer.width / 10;
    bunker.height = bunker.width;
    bunker.x = ((bunkerSize+40)*i);
    bunker.y = bunkerY;
    app.stage.addChild(bunker);
    bunkers.push(bunker);
  }
}




function initPlayer(resources){
  player = new PIXI.Sprite(resources.player.texture);
  player.width = playerSize;
  player.height = playerSize;
  player.x = 50;
  player.y = bunkerY + playerSize + 10;
  app.stage.addChild(player);
}

function playerMove(dir){
  if(dir=='left'){
    player.x -= playerSpeed;
  }else{
    player.x += playerSpeed;
  }
}


function playerShoot(){
  // TODO: possibly just init like 10 bullets and pool them..
  var thickness = playerSize/20;
  var bullet = new PIXI.Graphics();
  bullet.lineStyle(thickness, COLOR_GREEN_HEX);
  bullet.moveTo(0,0);
  bullet.lineTo(0,thickness*4);
  bullet.x = player.x+(playerSize/2);
  bullet.y = player.y;
  app.stage.addChild(bullet);
  playerBullets.push(bullet);
}




function invaderShoot(){
  // console.log("fire!")


}


function hitTest(a, b){
  var ab = a.getBounds();
  var bb = b.getBounds();
  return ab.x + ab.width > bb.x && ab.x < bb.x + bb.width && ab.y + ab.height > bb.y && ab.y < bb.y + bb.height;
}


function hitBunker(bullet, bunker){
  app.stage.removeChild(bullet);
  app.stage.removeChild(bunker);
}
function hitInvader(bullet, invader){
  app.stage.removeChild(bullet);
  app.stage.removeChild(invader);
}


function startGame(){
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
  app.ticker.add(() => {
    // move bullets up until they strike someone or go off the edge...
    for(var i=0; i<playerBullets.length; i++){
      var bullet = playerBullets[i];
      if(bullet){
        // see if it's hitting the bunkers...
        for(var j=0; j<bunkers.length; j++){
          if(hitTest(bullet, bunkers[i])){
            hitBunker(bullet, bunkers[i]);
          }
        }
        // see if it hit's an invader
        for(var j=0; j<invaders.length; j++){
          if(hitTest(bullet, invaders[i])){
            hitInvader(bullet, invaders[i]);
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


// console.log(playerBullets.length);
       // each frame we spin the bunny around a bit
      // invader.rotation += 0.02;
  });

}

loadAssets();