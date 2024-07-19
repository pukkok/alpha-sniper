const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const characterImg = new Image()
characterImg.src = './public/main.png'

const alphabets = 'QWER'.split('')
const _alphabets = 'ASDF'.split('')
const _alphabets2 = 'ZXCV'.split('')
const _alphabets3 = 'TGBYHN'.split('')
const _alphabets4 = 'UJMKIOP'.split('')
let enemies = []
let enemyRespawnInterval = 3000 // 적 리스폰 시간 (밀리초)
let spawnTimer
let boardTimer
let characterMovingAnimationFrame
let enemyMovingAnimationFrame
let gamePaused = false
let gameStarted = false

/*******************************************/

let score = 0
let selectedAlphabet = ''
let lives = 10
let level = 1
let startTime = Date.now()

/*******************************************/

let character = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    speed: 3,
    range: 350,
    targetX: null,
    targetY: null,
    moving: false
}

let movePoint = {
    x: null,
    y: null
}

const startBox = document.getElementById('start-box')
const startButton = document.getElementById('start-button')

// 캐릭터 그리기
function drawCharacter() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (movePoint.x !== null && movePoint.y !== null) {
        drawMovePoint()
    }
    ctx.drawImage(characterImg, character.x - character.width / 2, character.y - character.height / 2, character.width, character.height)

    // 3점 범위
    ctx.beginPath()
    ctx.strokeStyle = 'blue'
    ctx.arc(character.x, character.y, character.width / 2 + character.range - 30 * (level-1), 0, 2 * Math.PI)
    ctx.stroke()
    ctx.closePath()

    drawEnemies()
}

// 움직이는 곳 포인트
function drawMovePoint() {
    ctx.beginPath()
    ctx.fillStyle = 'yellowgreen'
    ctx.arc(movePoint.x, movePoint.y, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.closePath()

    ctx.beginPath()
    ctx.strokeStyle = 'yellowgreen'
    ctx.arc(movePoint.x, movePoint.y, 10, 0, Math.PI * 2)
    ctx.stroke()
    ctx.closePath()

    ctx.beginPath()
    ctx.strokeStyle = 'yellowgreen'
    ctx.arc(movePoint.x, movePoint.y, 15, 0, Math.PI * 2)
    ctx.stroke()
    ctx.closePath()
}

// 적 그리기
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.closePath()

        ctx.strokeStyle = enemy.removing ? 'green' : (enemy.clickedWrong ? 'red' : 'violet')
        ctx.beginPath()
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, 2 * Math.PI)
        ctx.stroke()
        ctx.closePath()

        ctx.fillStyle = enemy.removing ? 'green' : (enemy.clickedWrong ? 'red' : 'violet')
        ctx.font = '30px noto-sans'
        const textMetrics = ctx.measureText(enemy.alphabet)
        const textX = enemy.x - textMetrics.width / 2
        const textY = enemy.y + textMetrics.actualBoundingBoxAscent / 2
        ctx.fillText(enemy.alphabet, textX, textY)
    })
}

function moveEnemies() {
    if (gamePaused || !gameStarted) return;

    enemies.forEach((enemy, index) => {
        if (enemy.removing) return

        const dx = character.x - enemy.x
        const dy = character.y - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > enemy.speed) {
            enemy.x += enemy.speed * (dx / distance)
            enemy.y += enemy.speed * (dy / distance)
        }

        if (distance <= character.width / 2 + enemy.radius) {
            lives < 3 ? lives = 0 : lives -= 3
            enemies.splice(index, 1) // 적을 제거
            drawBoard()
            if (lives === 0) {
                gameOver()
            }
        }
    })

    drawCharacter()
    enemyMovingAnimationFrame = requestAnimationFrame(moveEnemies)
}

function moveCharacter() {
    if (gamePaused || !gameStarted) return;

    if (character.targetX !== null && character.targetY !== null) {
        const dx = character.targetX - character.x
        const dy = character.targetY - character.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > character.speed) {
            character.x += character.speed * (dx / distance)
            character.y += character.speed * (dy / distance)
            character.moving = true
        } else {
            character.x = character.targetX
            character.y = character.targetY
            character.targetX = null
            character.targetY = null
            movePoint.x = null
            movePoint.y = null
            character.moving = false
        }

        drawCharacter()

        if (character.moving) {
            characterMovingAnimationFrame = requestAnimationFrame(moveCharacter)
        }
    }
}

function spawnEnemy() {
    if (gamePaused || !gameStarted) return;

    let enemyX, enemyY

    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height

    if (x < 10) {
        enemyX = x
        enemyY = y
    } else if (x > canvas.width - 10) {
        enemyX = canvas.width - 10
        enemyY = y
    } else {
        enemyX = x
        const halfChance = Math.random() * 10
        if (halfChance > 5){
            enemyY = halfChance
        }else{
            enemyY = canvas.height - halfChance
        }
    }

    const newEnemy = {
        alphabet: alphabets[Math.floor(Math.random() * alphabets.length)],
        x: enemyX,
        y: enemyY,
        radius: 20,
        speed: 1,
        removing: false,
        clickedWrong: false,
        removeStartTime: null
    }

    enemies.push(newEnemy)
}



canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    if (gamePaused || !gameStarted) return;

    canvas.style.cursor = 'auto'
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    character.targetX = mouseX
    character.targetY = mouseY

    movePoint.x = mouseX
    movePoint.y = mouseY

    if (!character.moving) {
        characterMovingAnimationFrame = requestAnimationFrame(moveCharacter)
    }
})

// 캐릭터 로딩 완료
characterImg.onload = () => {
    drawCharacter()
    spawnTimer = setInterval(spawnEnemy, enemyRespawnInterval)
    drawBoard()
}

const boardCanvas = document.getElementById('board-canvas')
const boardCtx = boardCanvas.getContext('2d')

boardCanvas.width = 150
boardCanvas.height = 180

function drawBoard() {
    boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height)
    boardCtx.font = '20px noto-sans'

    // 타이머 표시
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000)
    const minutes = Math.floor(elapsedTime / 60)
    const seconds = elapsedTime % 60
    let timeString = `시간 : ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    if(gamePaused) fillStyle = 'white'
    boardCtx.fillStyle = 'black'
    boardCtx.fillText(timeString, 20, 40)

    // 점수, 타겟, 라이프
    boardCtx.fillStyle = 'black'
    boardCtx.fillText('점수 : ' + score, 20, 80)
    boardCtx.fillText('목숨 : ', 20, 120)
    if(lives >7 && lives <= 10){
        boardCtx.fillStyle = 'green'
    }else if(lives > 4 && lives <= 7){
        boardCtx.fillStyle = 'orange'
    }else{
        boardCtx.fillStyle = 'red'
    }
    boardCtx.fillText(lives, 80, 120)
    boardCtx.fillStyle = 'red'
    boardCtx.fillText('타겟 : ' + selectedAlphabet, 20, 160)

}

// 클릭 이벤트
window.addEventListener('keydown', (e) => {
    if (alphabets.includes(e.key.toUpperCase())) {
        selectedAlphabet = e.key.toUpperCase()
        drawBoard()
        canvas.style.cursor = 'url(./public/attack-cursor_2.cur), auto'
    }

    if (e.code === 'Space') {
        cancelAnimationFrame(characterMovingAnimationFrame)
        movePoint.x = null
        movePoint.y = null
        character.moving = false
        drawCharacter()
    }

    if (e.code === 'Escape') {
        gamePaused = !gamePaused
        if (!gamePaused) {
            moveEnemies()
            moveCharacter()
        }
    }
})

// 캔버스 클릭 이벤트(게임 플레이)
canvas.addEventListener('click', (e) => {
    if (gamePaused || !gameStarted) return;

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    let enemyClicked = false

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i]
        const dx = mouseX - enemy.x
        const dy = mouseY - enemy.y
        
        const distance = Math.sqrt(dx * dx + dy * dy)

        const cursorDx = mouseX - character.x
        const cursorDy = mouseY - character.y

        const cursorDistance = Math.sqrt(cursorDx * cursorDx + cursorDy * cursorDy)
        
        const characterRadius = character.width / 2 + character.range - 30 * (level-1)
        if (distance <= enemy.radius && !enemy.removing) { // 지워지는 중이 아닌경우

            enemyClicked = true
            if (enemy.alphabet === selectedAlphabet) {
                enemy.removing = true
                enemy.removeStartTime = Date.now()
                if (cursorDistance <= characterRadius) {
                    score += 3 // 캐릭터의 파란 원 안에서 적을 처치하면 3점
                } else {
                    score += 1 // 캐릭터의 파란 원 밖에서 적을 처치하면 1점
                }

                if (score > 30 && level === 1){
                    level = 2
                    alphabets.push(..._alphabets)
                } else if(score > 70 && level === 2){
                    level = 3
                    alphabets.push(..._alphabets2)
                } else if(score > 100 && level === 3){
                    level = 4
                    alphabets.push(..._alphabets3)
                    enemyRespawnInterval = 2000
                    spawnTimer = setInterval(spawnEnemy, enemyRespawnInterval)
                } else if(score > 200 && level === 4){
                    level = 5
                    enemyRespawnInterval = 1000
                    spawnTimer = setInterval(spawnEnemy, enemyRespawnInterval)
                }

            } else {
                enemy.clickedWrong = true
                setTimeout(() => {
                    enemy.clickedWrong = false
                }, 500)
                lives < 2 ? lives = 0 : lives -= 2
                drawBoard()
                if (lives === 0) {
                    gameOver()
                }
            }
            drawBoard()
            break
        }
    }

    if (!enemyClicked) {
        // 바닥을 클릭한 경우 라이프 1 감소
        lives -= 1
        drawBoard()
        if (lives === 0) {
            gameOver()
        }
    }
})

function removeEnemies() {
    const currentTime = Date.now()
    enemies.forEach((enemy, index) => {
        if (enemy.removing) {
            const elapsedTime = currentTime - enemy.removeStartTime
            if (elapsedTime >= 1000) {
                enemies.splice(index, 1)
            }
        }
    })
    requestAnimationFrame(removeEnemies)
}


boardCanvas.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()

    const rect = boardCanvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    if (mouseX >= boardCanvas.width - 180 && mouseX <= boardCanvas.width - 180 + 150 && 
        mouseY >= 10 && mouseY <= 40) {
        gamePaused = !gamePaused
        if (!gamePaused) {
            moveEnemies()
            moveCharacter()
        }
    }
})

// 게임 시작
startButton.addEventListener('click', () => {
    startBox.style.display = 'none'
    if(!gameStarted){
        reset()
    }
    gameStarted = true
    startTime = Date.now()
    
    drawCharacter()
    moveEnemies()
    removeEnemies()
    spawnTimer = setInterval(spawnEnemy, enemyRespawnInterval)
    boardTimer = setInterval(drawBoard, 1000)
})

// 게임 패배
function gameOver () {
    startBox.style.display = 'block'
    cancelAnimationFrame(enemyMovingAnimationFrame)
    cancelAnimationFrame(characterMovingAnimationFrame)
    alert(`최종 점수 : ${score}`)
    clearInterval(boardTimer)
    gameStarted = false
}

// 초기화
function reset () {
    character = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        width: 50,
        height: 50,
        speed: 3,
        range: 350,
        targetX: null,
        targetY: null,
        moving: false
    }
    score = 0
    level = 1
    lives = 10
    enemies = []
    enemyRespawnInterval = 3000
    startTime = Date.now()
    
}