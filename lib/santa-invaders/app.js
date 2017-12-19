// global variables
window.COLOR_RED = "#ea2220";
window.COLOR_RED_HEX = "0xea2220";
window.COLOR_GREEN = "#3db36e";
window.COLOR_GREEN_HEX = '0x3db36e';
window.IMG_PATH = './img/assets/0.5x/';
window.BG_IMG_WIDTH = 1920;
window.BG_IMG_HEIGHT = 1080;


var MobileDetect = require('mobile-detect');
var md = new MobileDetect(window.navigator.userAgent);

window.MOBILE = md.mobile();
// console.log( md.mobile() );          // 'Sony'
// console.log( md.phone() );           // 'Sony'
// console.log( md.tablet() );          // null
// console.log( md.userAgent() );       // 'Safari'
// console.log( md.os() );              // 'AndroidOS'
// console.log( md.is('iPhone') );      // false
// console.log( md.is('bot') );         // false
// console.log( md.version('Webkit') );         // 534.3
// console.log( md.versionStr('Build') );       // '4.1.A.0.562'
// console.log( md.match('playstation|xbox') ); // false

//
var $ = require('jquery');
var PIXI = require('pixi.js');


var Howler = require('howler');
var audioSoundtrack = new Howler.Howl({
  src:['./audio/soundtrack.mp3'],
  autoplay:true,
  loop:true,
  volume: 0.6
});


var audioPlayerShoot = new Howler.Howl({
  src:['./audio/shoot.mp3'],
  autoplay:false,
  loop:false,
  volume: 0.2
});

var audioPlayerExplode = new Howler.Howl({
  src:['./audio/SFX_Explosion_20.mp3'],
  autoplay:false,
  loop:false,
  volume: 0.2
});

var audioInvaderExplode = new Howler.Howl({
  src:['./audio/SFX_Explosion_02.mp3'],
  autoplay:false,
  loop:false,
  volume: 0.2
});


const app = new PIXI.Application({ width:275, height:206, transparent:true });
document.getElementById('santa-invaders').appendChild(app.view);

var windowWidth = $(window).width();
var windowHeight = $(window).height();
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

const bulletSpeed = 2;
// continuous shooting isn't fun, stop it
const bulletFireRate = 40;
var bulletFireRateCount = bulletFireRate;

var invaders = [];
var bunkers = [];
var player = undefined;

var playerSpeed = 10;

var playerBullets = [];
var invaderBullets = [];

var invadersContainer = undefined;
var invadersContainerWidth = 0;
// refernce to loaded resources...
var loadedResources = undefined;
var PLAY_STATE = false;
var GAME_INITIALIZED = false;
var ASSETS_LOADED = true;



if(MOBILE){
  // hide the browser chrome on mobile
  // When ready...
  window.addEventListener("load",function() {
    // Set a timeout...
    setTimeout(function(){
      // Hide the address bar!
      window.scrollTo(0, 1);
    }, 0);

    $(window).on("resize", function(){
      windowWidth = $(window).width();
      windowHeight = $(window).height();

      if(MOBILE){
        // if mobile and not landscape, zoom in a bit..
        if(windowWidth < windowHeight){
          $("body").css("zoom", 1.7);
        }else{
          $("body").css("zoom", 1);
        }
      }
    });
    $(window).resize();

  });



}




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
    // winGame();
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

  invadersContainerWidth = invadersContainer.width;

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

  // don't allow continuous shooting

  if(bulletFireRateCount >= bulletFireRate){
    bulletFireRateCount=0;

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
    //invaderExplode

    audioPlayerShoot.play();
  }
}




function invaderShoot(){
  // TODO: possibly just init like 10 bullets and pool them..
  var thickness = playerSize/20;
  var bullet = new PIXI.Graphics();
  var invader = invaders[Math.floor(Math.random()*invaders.length)];
  if(invader){
    bullet.lineStyle(thickness, COLOR_RED_HEX);
    bullet.moveTo(0,0);
    bullet.lineTo(0,thickness*4);
    bullet.x = Math.round(invadersContainer.x + (invader.x+(playerSize/2)));
    bullet.y = Math.round(invader.y);
    app.stage.addChild(bullet);
    invaderBullets.push(bullet); 
  }else{
    PLAY_STATE = false;
    app.stage.removeChild(player);
    winGame();
  }
}




function hitTest(a, b){
  var ab = a.getBounds();
  var bb = b.getBounds();
  return ab.x + ab.width > bb.x && ab.x < bb.x + bb.width && ab.y + ab.height > bb.y && ab.y < bb.y + bb.height;
}




function hitInvader(bullet, invader){
  // play the explosion animation
  if(PLAY_STATE){
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

    // remove invader
    invadersContainer.removeChild(invader);


    audioInvaderExplode.play();

    if(invadersContainer.children.length == 0){
      PLAY_STATE = false;
      app.stage.removeChild(player);
      winGame();
    }

  }
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

    audioPlayerExplode.play();

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
  if(MOBILE){
    $('#start-screen-mobile').css('display','inline-block');
    $('#start-game-mobile').off();
    $('#start-game-mobile').on('click', function(){
      $('#start-screen-mobile').css('display','none');
      startGame();
    });
  }else{
    $('#start-screen-web').css('display','inline-block');
    $('#start-game').off();
    $('#start-game').on('click', function(){
      $('#start-screen-web').css('display','none');
      startGame();
    });
  }
}


function endGame(){
  if(MOBILE){
    $("#mobile-controls").css("display", "none");
  }
  // go through and remove all the bullets from stage, etc
  resetGame();
  // change the game over message text to one of these random strings..
  var messages = [
    'You gave it your all. That\'s all we could hope for, really.',
    'Try again. Or don\'t. It\'s your world.',
    'Try again. And enjoy your lump of coal.',
    'Bah humbug. What a strange phrase... you lost.',
    'It\'s just not your year. Better luck in 2018.',
    'Joy to the world, you lost the game.'
  ];

  var s = messages[Math.floor(Math.random()*messages.length)];
  $("#game-over-message").html(s);

  // show the game over screen...
  $('#game-over-screen').css('display','inline-block');
  $('#reset-game').off();
  $('#reset-game').on('click', function(){
    $('#game-over-screen').css('display','none');
    startGame();
  });
}


function winGame(){
  // 
  if(MOBILE){
    $("#mobile-controls").css("display", "none");
  }
  // go through and remove all the bullets from stage, etc
  resetGame();
  // show the game over screen...
  $('#win-screen').css('display','inline-block');
  $('#reset-game-win').off();
  $('#reset-game-win').on('click', function(){
    $('#win-screen').css('display','none');
    startGame();
  });
}




function startGame(){
  initInvaders();
  initBunkers();
  initPlayer();

  PLAY_STATE = true;

  if(MOBILE){

    $("#mobile-controls").css("display", "block");

    $("#mobile-controls .left").off();
    $("#mobile-controls .left").on("click", function(e){ playerMove('left'); });

    $("#mobile-controls .right").off();
    $("#mobile-controls .right").on("click", function(e){ playerMove('right'); });

    $("#mobile-controls .middle").off();
    $("#mobile-controls .middle").on("click", function(e){ playerShoot(); });

  }else{

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
  }

  // Listen for frame updates

  if(!GAME_INITIALIZED){
    var invadersDirection = 'left';

    app.ticker.add(() => {
      // console.log('hi')
      bulletFireRateCount++;

      if(PLAY_STATE){
        // move the invaders...
        if(invadersDirection == 'left'){
          invadersContainer.x += 0.5;
          if(invadersContainer.x > app.renderer.width-invadersContainerWidth){
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
              bullet.y -= bulletSpeed; 
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
              bullet.y += bulletSpeed; 
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


/// load em up..
loadAssets();



