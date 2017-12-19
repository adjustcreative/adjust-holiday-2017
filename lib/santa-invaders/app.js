window.COLOR_RED = "#ea2220";
window.COLOR_GREEN = "#3db36e";
window.IMG_PATH = './img/assets/0.5x/';

//
var PIXI = require('pixi.js');

const app = new PIXI.Application({ width:290, height:206, transparent:true });
document.getElementById('santa-invaders').appendChild(app.view);

const invaders = [];
const bunkers = [];
var player = undefined;

const invaderSize = app.renderer.width / 12;
const bunkerSize = app.renderer.width / 10;
const playerSize = app.renderer.width / 12;

const bunkerY = (invaderSize*3)+40;


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


function startGame(){
    // // Listen for frame updates
    // app.ticker.add(() => {
    //      // each frame we spin the bunny around a bit
    //     // invader.rotation += 0.02;
    // });

}

loadAssets();