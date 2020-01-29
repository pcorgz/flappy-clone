/*
 * Returns a random integer between min (inclusive) and max (inclusive).
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let canvas;
let ctx;

let playerObj;
let score;
let objects = [];
let topObstacles = [];
let botObstacles = [];
let scorers = [];

let gameRunning;
let gravity = 0.35;

let animationFrame;

function move(pos, vel) {
    pos.x += vel.x;
    pos.y += vel.y;
}

function init() {
    canvas = document.getElementById("game");
    
    canvas.width = window.outerWidth < 350
        ? 350
        : Math.min(window.outerWidth, 500);        
    canvas.height = 500;

    ctx = canvas.getContext('2d');
    ctx.font = "2rem Arial";
    ctx.textAlign = "center";

    createPlayerObj();
    createObstaclesScorers();
    pushObjects();
    initObjects();
    
    score = 0;
    gameRunning = true;
    animationFrame = window.requestAnimationFrame(this.game);
}

function resetGame() {
    if (gameRunning) {
        gameRunning = false;
        window.cancelAnimationFrame(animationFrame);
    }

    playerObj = undefined;
    objects = [];
    topObstacles = [];
    botObstacles = [];
    scorers = [];

    init();
}

function createPlayerObj() {
    playerObj = new Player();

    window.onkeydown = function(e) {
        if (e.key.toLowerCase() === "w" || e.key === "ArrowUp" || e.key === " ") {
            playerObj.isJumping = true;
        }

        if (gameRunning === false && e.key.toLowerCase() === "r") {
            resetGame();
        }
    }

    window.onkeyup = function(e) {
        if (e.key.toLowerCase() === "w" || e.key === "ArrowUp" || e.key === " ") {
            playerObj.isJumping = false;
        }
    }
}

function createObstaclesScorers() {
    for (let i = 0; i < 4; i++) {
        let randY = getRandomInt(-340, -140);

        let posTop = { x: 500 + (220 * i), y: randY };
        let posBot = { x: posTop.x, y: posTop.y + canvas.height + 60 };

        let posScorer = { x: posTop.x + 50, y: posBot.y - 140 };

        let obsTop = new Obstacle(i, posTop);
        let obsBot = new Obstacle(i, posBot);

        let scorer = new Scorer(i, posScorer);

        topObstacles.push(obsTop);
        botObstacles.push(obsBot);
        scorers.push(scorer);
    }
}

function pushObjects() {
    for (let i = 0; i < topObstacles.length; i++) {
        const obsTop = topObstacles[i];
        const obsBot = botObstacles[i];
        const scorer = scorers[i];

        objects.push(obsTop);
        objects.push(obsBot);
        objects.push(scorer);
    }

    objects.push(playerObj);
}

function initObjects() {
    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        if (typeof obj.init === 'function') {
            obj.init();
        }
    }
}

function game() {
    if (gameRunning === false) {
        return;
    }

    this.update();
    this.detectCollision();
    this.draw();
    window.requestAnimationFrame(this.game);
}

function update() {
    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        if (typeof obj.update === 'function') {
            obj.update();
        }
    }
}

function detectCollision() {
    for (let i = 0; i < topObstacles.length; i++) {
        const obsTop = topObstacles[i];
        const obsBot = botObstacles[i];
        const scorer = scorers[i];

        if (rectCircleColliding(playerObj, obsTop) || rectCircleColliding(playerObj, obsBot)) {
            gameRunning = false;
        }

        let insideScorer = rectCircleColliding(playerObj, scorer);
        if (scorer.canHit && insideScorer) {
            score++;
            scorer.canHit = false;
        }
    }
}

// return true if the rectangle and circle are colliding
function rectCircleColliding(circle, rect) {
    var distX = Math.abs(circle.pos.x - rect.pos.x - rect.size.w / 2);
    var distY = Math.abs(circle.pos.y - rect.pos.y - rect.size.h / 2);

    if (distX > (rect.size.w / 2 + circle.radius)) { return false; }
    if (distY > (rect.size.h / 2 + circle.radius)) { return false; }

    if (distX <= (rect.size.w / 2)) { return true; }
    if (distY <= (rect.size.h / 2)) { return true; }

    var dx = distX - rect.size.w / 2;
    var dy = distY - rect.size.h / 2;
    return (dx * dx + dy * dy <= (circle.radius * circle.radius));
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        if (typeof obj.draw === 'function') {
            obj.draw();
        }
    }

    ctx.fillStyle = "black";
    ctx.strokeText("Score: " + score, canvas.width / 2, 50);

    if (gameRunning === false) {
        ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
        ctx.font = "1.2rem Arial";
        ctx.fillText("Press \"R\" to reset", canvas.width / 2, canvas.height / 2 + 50);
    }
}

class Player {
    constructor() {
        this.radius = 15;
        this.pos = { x: 30, y: canvas.height / 2 - this.radius };
        this.vel = { x: 0, y: 0 };
        this.jumpPower = -7;
        this.isJumping = false;
        this.color = 'blue';
    }

    update() {
        move(this.pos, this.vel);

        if (this.pos.y < this.radius) {
            this.pos.y = this.radius;
        }

        if (this.pos.y + this.radius <= canvas.height) {
            if (this.vel.y < 10)
                this.vel.y += gravity;
        } else {
            this.pos.y = canvas.height - this.radius;
            gameRunning = false;
        }

        if (this.isJumping) {
            this.vel.y = this.jumpPower;
        }

    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
        ctx.fill();
    }
}

class Obstacle {
    constructor(i, pos) {
        this.index = i;
        this.pos = pos;
        this.size = { w: 60, h: canvas.height - 80 };
        this.color = 'green';
    }

    init() {
        this.velX = -5;
    }

    update() {
        this.pos.x += this.velX;

        if (this.pos.x + this.size.w < -40) {
            //debugger;
            this.pos.x = 780;

            if (this === topObstacles[this.index]) {
                this.pos.y = getRandomInt(-340, -140);
            }

            if (this === botObstacles[this.index])
                this.pos.y = topObstacles[this.index].pos.y + canvas.height + 60;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.rect(this.pos.x, this.pos.y, this.size.w, this.size.h);
        ctx.fill();
    }
}

class Scorer {
    constructor(i, pos) {
        this.index = i;
        this.pos = pos;
        this.size = { w: 10, h: 140 };
        this.color = 'transparent';
    }

    init() {
        this.velX = -5;
        this.canHit = true;
    }

    update() {
        this.pos.x += this.velX;

        if (this.pos.x + this.size.w < -90) {
            this.pos.x = topObstacles[this.index].pos.x + 50;

            this.pos.y = botObstacles[this.index].pos.y + -140;

            this.canHit = true;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.rect(this.pos.x, this.pos.y, this.size.w, this.size.h);
        ctx.fill();
    }
}