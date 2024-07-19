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
const enemies = []
const enemyRespawnInterval = 2000 // 적 리스폰 시간 (밀리초)
let characterMovingAnimationFrame
let enemyMovingAnimationFrame
let gamePaused = false
let gameStarted = false

/*******************************************/

let score = 0
let selectedAlphabet = ''
let lives = 10
let stage = 1
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

function drawCharacter() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (movePoint.x !== null && movePoint.y !== null) {
        drawMovePoint()
    }
    ctx.drawImage(characterImg, character.x - character.width / 2, character.y - character.height / 2, character.width, character.height)

    ctx.beginPath()
    ctx.strokeStyle = 'blue'
    ctx.arc(character.x, character.y, character.width / 2 + character.range - 30 * (stage-1), 0, 2 * Math.PI)
    ctx.stroke()
    ctx.closePath()

    drawEnemies()
}

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
            lives -= 3
            enemies.splice(index, 1) // 적을 제거
            drawBoard()
            if (lives <= 0) {
                cancelAnimationFrame(enemyMovingAnimationFrame)
                cancelAnimationFrame(characterMovingAnimationFrame)
                alert('Game Over')
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

characterImg.onload = () => {
    drawCharacter()
    setInterval(spawnEnemy, enemyRespawnInterval)
}

const boardCanvas = document.getElementById('board-canvas')
const boardCtx = boardCanvas.getContext('2d')

boardCanvas.width = window.innerWidth
boardCanvas.height = window.innerHeight / 100 * 7

function drawBoard() {
    boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height)
    boardCtx.fillStyle = 'black'
    boardCtx.font = '20px noto-sans'

    // 점수, 타겟, 라이프
    boardCtx.fillText('점수 : ' + score, 20, 40)
    boardCtx.fillText('타겟 : ' + selectedAlphabet, 200, 40)
    boardCtx.fillText('라이프 : ' + lives, 400, 40)

    // 정지 버튼 디자인
    boardCtx.fillStyle = 'red'
    boardCtx.fillRect(boardCanvas.width - 180, 10, 150, 30)
    boardCtx.fillStyle = 'white'
    boardCtx.fillText('정지', boardCanvas.width - 150, 30)

    // 타이머 표시
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000)
    const minutes = Math.floor(elapsedTime / 60)
    const seconds = elapsedTime % 60
    const timeString = `타이머: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    boardCtx.fillStyle = 'black'
    boardCtx.fillText(timeString, boardCanvas.width - 350, 40)

}

drawBoard()

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

        const point = Math.sqrt(cursorDx * cursorDx + cursorDy * cursorDy)
        
        const characterRadius = character.width / 2 + character.range - 30 * (stage-1)
        if (distance <= enemy.radius && !enemy.removing) { // 지워지는 중이 아닌경우
            // console.log(Math.floor(distance))
            enemyClicked = true
            if (enemy.alphabet === selectedAlphabet) {
                enemy.removing = true
                enemy.removeStartTime = Date.now()
                if (point <= characterRadius) {
                    score += 3 // 캐릭터의 파란 원 안에서 적을 처치하면 3점
                } else {
                    score += 1 // 캐릭터의 파란 원 밖에서 적을 처치하면 1점
                }

                if (score > 10 && stage === 1){
                    stage = 2
                    alphabets.push(..._alphabets)
                } else if(score > 30 && stage === 2){
                    stage = 3
                    alphabets.push(..._alphabets2)
                }

            } else {
                enemy.clickedWrong = true
                setTimeout(() => {
                    enemy.clickedWrong = false
                }, 500)
                lives < 2 ? lives = 0 : lives -= 2
                drawBoard()
                if (lives === 0) {
                    cancelAnimationFrame(enemyMovingAnimationFrame)
                    cancelAnimationFrame(characterMovingAnimationFrame)
                    alert('Game Over')
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
        if (lives <= 0) {
            cancelAnimationFrame(enemyMovingAnimationFrame)
            cancelAnimationFrame(characterMovingAnimationFrame)
            alert('Game Over')
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
removeEnemies()

startButton.addEventListener('click', () => {
    startBox.style.display = 'none'
    gameStarted = true
    startTime = Date.now()
    drawCharacter()
    moveEnemies()
    setInterval(spawnEnemy, enemyRespawnInterval)
    drawBoard()
})

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
