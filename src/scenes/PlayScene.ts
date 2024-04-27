import Phaser from "phaser";
import { SpriteWithDynamicBody } from "../types";
import { Player } from "../entities/Player";
import GameScene from "./GameScene";
import { PRELOAD_CONFIG } from "..";

class PlayScene extends GameScene{
    player : Player
    ground:Phaser.GameObjects.TileSprite
    clouds:Phaser.GameObjects.Group
    obstacles:Phaser.Physics.Arcade.Group
    startTrigger: SpriteWithDynamicBody
    scoreText:Phaser.GameObjects.Text

    highScore:Phaser.GameObjects.Text
    score:number=0
    scoreInterval:number=100
    scoreDeltaTime:number=0
    spawnInterval:number = 1500
    spawnTime:number = 0
    gameSpeed:number = 10
    gameSpeedModifier:number = 1

    reachSound:Phaser.Sound.HTML5AudioSound
    
    gameOverContainer:Phaser.GameObjects.Container
    gameOverText:Phaser.GameObjects.Image
    restartText:Phaser.GameObjects.Image

    constructor(){
        super('PlayScene')
    }

    create(){
        this.createEnvironment()
        this.createPlayer()

        this.creatObstacles()
        this.createGameOverContainer()

        this.createScore()

        this.createAnimations()

        this.handleGameStart()
        this.handleObstacleCollisions()
        this.handleGameRestart()  
        
        this.reachSound = this.sound.add('progress',{volume:.75}) as Phaser.Sound.HTML5AudioSound
    }

    update(time: number, delta: number): void {
        if(!this.isGameRunning){
            return
        }
         
        this.spawnTime +=delta
        this.scoreDeltaTime +=delta
        if(this.scoreDeltaTime >= this.scoreInterval){
            this.score++            
            this.scoreDeltaTime = 0

            if(this.score % 100 === 0){
                this.gameSpeedModifier += 0.25
                this.reachSound.play()
                this.add.tween({
                    targets:this.scoreText,
                    duration:100,
                    repeat:3,
                    alpha:0,
                    yoyo:true
                    
                })
            }
        }

        if(this.spawnTime >= this.spawnInterval){
            this.spawnObsatcle()
            this.spawnTime = 0
        }

        const score = Array.from(String(this.score),Number)

        for (let i = 0; i < 5 - String(this.score).length; i++) {
            score.unshift(0)
        }
        this.scoreText.setText(score.join(''))

        Phaser.Actions.IncX(this.obstacles.getChildren(),-this.gameSpeed * this.gameSpeedModifier)
        Phaser.Actions.IncX(this.clouds.getChildren(),-.75)

        this.obstacles.getChildren().forEach((obstacle:SpriteWithDynamicBody)=>{
            if(obstacle.getBounds().right < 0){
                this.obstacles.remove(obstacle)
            }
        })
        this.clouds.getChildren().forEach((cloud:SpriteWithDynamicBody)=>{
            if(cloud.getBounds().right < 0){
                cloud.x = this.gameWidth + 30
            }
        })
       this.ground.tilePositionX += (this.gameSpeed * this.gameSpeedModifier)  
        // console.log(this.obstacles.getChildren().length);x
        
    }
    createEnvironment(){
        this.ground = this.add.tileSprite(0,this.gameHeight,88,26,'ground').setOrigin(0,1)

        this.clouds = this.add.group()

        this.clouds = this.clouds.addMultiple([
            this.add.image(this.gameWidth/2,130,'cloud'),
            this.add.image(this.gameWidth -90,120,'cloud'),
            this.add.image(this.gameWidth/1.4,190,'cloud'),
        ])
        this.clouds.setAlpha(0)
    }
    createPlayer(){
        this.player = new Player(this,0,this.gameHeight,'dino-run')
    }
    handleGameStart(){
        this.startTrigger = this.physics.add.sprite(0,10,null).setAlpha(0).setOrigin(0,1)

        this.physics.add.overlap(this.startTrigger,this.player,()=>{
            if(this.startTrigger.y === 10){
                this.startTrigger.body.reset(0,this.gameHeight)
                console.log('trigger');
                return
            }

            this.startTrigger.body.reset(999999,999999)
            console.log('start game');
            const rollOutEvent = this.time.addEvent({
                delay:1000/60,
                loop:true,
                callback:()=>{
                    this.player.playRunAnimation()
                    this.player.setVelocityX(80)
                    this.ground.width += 34
                    if(this.ground.width >= this.gameWidth){
                        this.ground.width = this.gameWidth
                        rollOutEvent.remove()
                        this.player.setVelocityX(0)
                        this.clouds.setAlpha(1)
                        this.scoreText.setAlpha(1)
                        this.isGameRunning = true
                        console.log('roll out stopped');
                        
                    }
                }
            })  
        })
    }
    createAnimations(){
        this.anims.create({
            key:'enemy-bird-fly',
            frames:this.anims.generateFrameNumbers('enemy-bird'),
            frameRate:6,
            repeat:-1
        })
    }
    createScore(){
        this.scoreText = this.add.text(this.gameWidth,0,'00000',{
            fontSize:30,fontFamily:'Arial',color:'%535353',resolution:5
        }).setOrigin(1,0).setAlpha(0)

        this.highScore = this.add.text(this.scoreText.getBounds().left - 20,0,'00000',{
            fontSize:30,fontFamily:'Arial',color:'%535353',resolution:5
        }).setOrigin(1,0).setAlpha(0)
    }
    spawnObsatcle(){
        const obstacleCount = PRELOAD_CONFIG.cactusesCount + PRELOAD_CONFIG.birdCount
        const obstacleNum = Math.floor(Math.random()* obstacleCount) +1
        // const obstacleNum = 7

        const distance = Phaser.Math.Between(150,300)
        let obstacle;
        if(obstacleNum > PRELOAD_CONFIG.cactusesCount){
            const possibleEnemyHeight = [20,70]
            const enemyHeight = possibleEnemyHeight[Math.floor(Math.random()*2)]

            obstacle = this.obstacles.create(this.gameWidth+ distance,this.gameHeight - enemyHeight,'enemy-bird')
            obstacle.play('enemy-bird-fly',true)

        }else{
            obstacle = this.obstacles.create(this.gameWidth+ distance,this.gameHeight,`obstacle-${obstacleNum}`)
        }
        obstacle.setOrigin(0,1).setImmovable()

    }
    creatObstacles(){
        this.obstacles = this.physics.add.group()
    }
    createGameOverContainer(){
        this.gameOverText = this.add.image(0,0,'game-over')
        this.restartText = this.add.image(0,80,'restart')

        this.gameOverContainer = this.add.container(this.gameWidth/2,(this.gameHeight/2)-80 ).add([this.gameOverText,this.restartText]).setAlpha(0)
    }
    
    handleObstacleCollisions(){

        this.physics.add.collider(this.player,this.obstacles,()=>{
            this.isGameRunning = false
            this.physics.pause()
            this.anims.pauseAll()
            this.player.die()
            this.gameOverContainer.setAlpha(1)
            
            const newHighScore = this.highScore.text.substring(this.highScore.text.length - 5)
            const newScore = Number(newHighScore) > Number(this.scoreText.text) ? newHighScore : this.scoreText.text
            this.highScore.setText('HI '+newScore)
            this.highScore.setAlpha(0.5)

            this.spawnTime = 0
            this.scoreDeltaTime = 0
            this.gameSpeed = 10
        })
    }
    handleGameRestart(){
        this.restartText.on('pointerdown',()=>{
            this.physics.resume()
            this.player.setVelocityY(0)
            this.gameOverContainer.setAlpha(0)
            this.obstacles.clear(true,true) 
            this.anims.resumeAll()
            this.isGameRunning = true
            
            this.score = 0
            this.gameSpeedModifier = 1

        }).setInteractive()
    }
}

export default PlayScene