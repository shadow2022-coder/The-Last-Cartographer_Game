// The Last Cartographer - Game Logic

// Game State
let gameState = {
    player: {
        x: 7,
        y: 7,
        level: 1,
        xp: 0,
        xpToNext: 100,
        health: 100,
        maxHealth: 100,
        ink: 50,
        maxInk: 50,
        attack: 10,
        defense: 5,
        potions: 3,
        inkVials: 2
    },
    map: {
        width: 15,
        height: 15,
        cells: [],
        explored: []
    },
    combat: {
        active: false,
        enemy: null,
        playerDefending: false,
        turn: 'player'
    }
};

// Enemy types
const enemies = {
    shadowWraith: {
        name: "Shadow Wraith",
        health: 30,
        maxHealth: 30,
        attack: 8,
        defense: 2,
        xpReward: 25,
        symbol: "S"
    },
    fogGhoul: {
        name: "Fog Ghoul",
        health: 20,
        maxHealth: 20,
        attack: 6,
        defense: 1,
        xpReward: 15,
        symbol: "G"
    },
    lostSpirit: {
        name: "Lost Spirit",
        health: 40,
        maxHealth: 40,
        attack: 12,
        defense: 3,
        xpReward: 40,
        symbol: "L"
    }
};

// Map symbols
const mapSymbols = {
    player: "♦",
    fog: "?",
    explored: "·",
    enemy: "E",
    treasure: "T",
    wall: "█",
    ruins: "R"
};

// Initialize game
function initGame() {
    generateMap();
    updateDisplay();
    addMessage("You awaken in the fog-shrouded wasteland, cartographer's tools in hand...");
    
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyPress);
}

// Generate the game map
function generateMap() {
    gameState.map.cells = [];
    gameState.map.explored = [];
    
    // Initialize map with fog
    for (let y = 0; y < gameState.map.height; y++) {
        gameState.map.cells[y] = [];
        gameState.map.explored[y] = [];
        for (let x = 0; x < gameState.map.width; x++) {
            gameState.map.cells[y][x] = 'fog';
            gameState.map.explored[y][x] = false;
        }
    }
    
    // Add some walls
    const walls = [
        [3, 3], [3, 4], [3, 5],
        [11, 8], [11, 9], [11, 10],
        [7, 2], [8, 2], [9, 2],
        [1, 12], [2, 12], [3, 12]
    ];
    
    walls.forEach(([x, y]) => {
        if (x >= 0 && x < gameState.map.width && y >= 0 && y < gameState.map.height) {
            gameState.map.cells[y][x] = 'wall';
        }
    });
    
    // Add enemies
    const enemyPositions = [
        [2, 5], [12, 3], [5, 11], [10, 6], [4, 8], [13, 12], [1, 1]
    ];
    
    enemyPositions.forEach(([x, y]) => {
        if (gameState.map.cells[y][x] === 'fog') {
            gameState.map.cells[y][x] = 'enemy';
        }
    });
    
    // Add treasures
    const treasurePositions = [
        [6, 1], [14, 7], [0, 13], [9, 9]
    ];
    
    treasurePositions.forEach(([x, y]) => {
        if (gameState.map.cells[y][x] === 'fog') {
            gameState.map.cells[y][x] = 'treasure';
        }
    });
    
    // Add ruins
    const ruinPositions = [
        [5, 5], [11, 11]
    ];
    
    ruinPositions.forEach(([x, y]) => {
        if (gameState.map.cells[y][x] === 'fog') {
            gameState.map.cells[y][x] = 'ruins';
        }
    });
    
    // Explore starting area
    exploreArea(gameState.player.x, gameState.player.y, 2);
}

// Handle keyboard input
function handleKeyPress(event) {
    if (gameState.combat.active) return;
    
    let newX = gameState.player.x;
    let newY = gameState.player.y;
    
    switch(event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            newY--;
            break;
        case 's':
        case 'arrowdown':
            newY++;
            break;
        case 'a':
        case 'arrowleft':
            newX--;
            break;
        case 'd':
        case 'arrowright':
            newX++;
            break;
        default:
            return;
    }
    
    event.preventDefault();
    movePlayer(newX, newY);
}

// Move player
function movePlayer(newX, newY) {
    // Check bounds
    if (newX < 0 || newX >= gameState.map.width || newY < 0 || newY >= gameState.map.height) {
        addMessage("You can't go that way - the fog grows too thick.");
        return;
    }
    
    // Check for walls
    if (gameState.map.cells[newY][newX] === 'wall') {
        addMessage("A crumbling wall blocks your path.");
        return;
    }
    
    // Check if player has ink
    if (gameState.player.ink <= 0) {
        addMessage("You're out of ink! Find an ink vial to continue mapping.");
        return;
    }
    
    // Move player
    gameState.player.x = newX;
    gameState.player.y = newY;
    gameState.player.ink--;
    
    // Check for encounters
    const cellType = gameState.map.cells[newY][newX];
    
    switch(cellType) {
        case 'enemy':
            startCombat();
            break;
        case 'treasure':
            findTreasure();
            gameState.map.cells[newY][newX] = 'explored';
            break;
        case 'ruins':
            exploreRuins();
            gameState.map.cells[newY][newX] = 'explored';
            break;
        default:
            addMessage(`You step forward, mapping the terrain... (Ink: ${gameState.player.ink})`);
    }
    
    // Explore surrounding area
    exploreArea(newX, newY, 1);
    updateDisplay();
}

// Explore area around player
function exploreArea(centerX, centerY, radius) {
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const x = centerX + dx;
            const y = centerY + dy;
            
            if (x >= 0 && x < gameState.map.width && y >= 0 && y < gameState.map.height) {
                gameState.map.explored[y][x] = true;
            }
        }
    }
}

// Start combat encounter
function startCombat() {
    const enemyTypes = Object.keys(enemies);
    const randomEnemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    gameState.combat.enemy = { ...enemies[randomEnemyType] };
    gameState.combat.active = true;
    gameState.combat.playerDefending = false;
    gameState.combat.turn = 'player';
    
    document.getElementById('combat-screen').classList.remove('hidden');
    document.getElementById('enemy-name').textContent = gameState.combat.enemy.name;
    
    clearCombatLog();
    addCombatLog(`A ${gameState.combat.enemy.name} emerges from the fog!`, '');
    
    updateCombatDisplay();
}

// Combat actions
function combatAction(action) {
    if (gameState.combat.turn !== 'player') return;
    
    gameState.combat.playerDefending = false;
    
    switch(action) {
        case 'attack':
            playerAttack();
            break;
        case 'defend':
            playerDefend();
            break;
        case 'potion':
            useHealthPotionInCombat();
            break;
        case 'skill':
            useSkill();
            break;
    }
    
    if (gameState.combat.active && gameState.combat.enemy.health > 0) {
        setTimeout(enemyTurn, 1000);
    }
}

// Player attack
function playerAttack() {
    const damage = Math.max(1, gameState.player.attack - gameState.combat.enemy.defense + Math.floor(Math.random() * 6) - 2);
    gameState.combat.enemy.health -= damage;
    
    addCombatLog(`You attack for ${damage} damage!`, 'player-action');
    
    if (gameState.combat.enemy.health <= 0) {
        winCombat();
        return;
    }
    
    gameState.combat.turn = 'enemy';
    updateCombatDisplay();
}

// Player defend
function playerDefend() {
    gameState.combat.playerDefending = true;
    addCombatLog("You raise your guard, reducing incoming damage!", 'player-action');
    
    gameState.combat.turn = 'enemy';
}

// Use health potion in combat
function useHealthPotionInCombat() {
    if (gameState.player.potions <= 0) {
        addCombatLog("You don't have any health potions!", '');
        return;
    }
    
    const healAmount = 30 + Math.floor(Math.random() * 21); // 30-50 healing
    gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + healAmount);
    gameState.player.potions--;
    
    addCombatLog(`You drink a health potion and recover ${healAmount} health!`, 'player-action');
    
    gameState.combat.turn = 'enemy';
    updateCombatDisplay();
}

// Use skill
function useSkill() {
    if (gameState.player.ink < 10) {
        addCombatLog("Not enough ink to use your cartographer's skill!", '');
        return;
    }
    
    gameState.player.ink -= 10;
    const damage = Math.floor(gameState.player.attack * 1.5) + Math.floor(Math.random() * 8);
    gameState.combat.enemy.health -= damage;
    
    addCombatLog(`You channel your mapping knowledge into a precise strike for ${damage} damage!`, 'player-action');
    
    if (gameState.combat.enemy.health <= 0) {
        winCombat();
        return;
    }
    
    gameState.combat.turn = 'enemy';
    updateCombatDisplay();
}

// Enemy turn
function enemyTurn() {
    if (!gameState.combat.active) return;
    
    let damage = Math.max(1, gameState.combat.enemy.attack - gameState.player.defense + Math.floor(Math.random() * 4) - 1);
    
    if (gameState.combat.playerDefending) {
        damage = Math.ceil(damage / 2);
        addCombatLog(`Your defense reduces the damage!`, '');
    }
    
    gameState.player.health -= damage;
    
    addCombatLog(`The ${gameState.combat.enemy.name} attacks you for ${damage} damage!`, 'enemy-action');
    
    if (gameState.player.health <= 0) {
        gameOver();
        return;
    }
    
    gameState.combat.turn = 'player';
    updateCombatDisplay();
}

// Win combat
function winCombat() {
    const xpGain = gameState.combat.enemy.xpReward;
    gameState.player.xp += xpGain;
    
    addCombatLog(`You defeated the ${gameState.combat.enemy.name}!`, 'player-action');
    addCombatLog(`You gain ${xpGain} experience points!`, '');
    
    // Check for level up
    if (gameState.player.xp >= gameState.player.xpToNext) {
        levelUp();
    }
    
    // Random loot
    if (Math.random() < 0.4) {
        if (Math.random() < 0.6) {
            gameState.player.potions++;
            addCombatLog("You found a health potion!", '');
        } else {
            gameState.player.inkVials++;
            addCombatLog("You found an ink vial!", '');
        }
    }
    
    // Clear enemy from map
    gameState.map.cells[gameState.player.y][gameState.player.x] = 'explored';
    
    setTimeout(endCombat, 2000);
}

// End combat
function endCombat() {
    gameState.combat.active = false;
    gameState.combat.enemy = null;
    document.getElementById('combat-screen').classList.add('hidden');
    updateDisplay();
    addMessage("The fog swirls around you as you continue your journey...");
}

// Game over
function gameOver() {
    addCombatLog("You have fallen to the creatures of the fog...", 'damage');
    addCombatLog("Your maps crumble to dust, and the world remains lost.", 'damage');
    
    setTimeout(() => {
        if (confirm("Game Over! Would you like to restart?")) {
            restartGame();
        }
    }, 2000);
}

// Level up
function levelUp() {
    gameState.player.level++;
    gameState.player.xp -= gameState.player.xpToNext;
    gameState.player.xpToNext = Math.floor(gameState.player.xpToNext * 1.5);
    
    // Increase stats
    const healthIncrease = 15 + Math.floor(Math.random() * 11); // 15-25
    const inkIncrease = 10 + Math.floor(Math.random() * 6); // 10-15
    const attackIncrease = 2 + Math.floor(Math.random() * 3); // 2-4
    const defenseIncrease = 1 + Math.floor(Math.random() * 2); // 1-2
    
    gameState.player.maxHealth += healthIncrease;
    gameState.player.health = gameState.player.maxHealth; // Full heal on level up
    gameState.player.maxInk += inkIncrease;
    gameState.player.ink = gameState.player.maxInk; // Full ink on level up
    gameState.player.attack += attackIncrease;
    gameState.player.defense += defenseIncrease;
    
    addCombatLog(`LEVEL UP! You are now level ${gameState.player.level}!`, 'player-action');
    addCombatLog(`Health +${healthIncrease}, Ink +${inkIncrease}, Attack +${attackIncrease}, Defense +${defenseIncrease}`, '');
    
    addMessage(`You feel your cartographer skills growing stronger! Level ${gameState.player.level}!`);
}

// Find treasure
function findTreasure() {
    const treasures = [
        { type: 'potion', amount: 2, message: "You discover a cache of health potions!" },
        { type: 'ink', amount: 3, message: "You find rare, high-quality ink vials!" },
        { type: 'both', message: "You uncover a cartographer's emergency supplies!" },
        { type: 'xp', amount: 50, message: "Ancient glyphs reveal mapping secrets to you!" }
    ];
    
    const treasure = treasures[Math.floor(Math.random() * treasures.length)];
    
    switch(treasure.type) {
        case 'potion':
            gameState.player.potions += treasure.amount;
            break;
        case 'ink':
            gameState.player.inkVials += treasure.amount;
            break;
        case 'both':
            gameState.player.potions += 1;
            gameState.player.inkVials += 2;
            break;
        case 'xp':
            gameState.player.xp += treasure.amount;
            if (gameState.player.xp >= gameState.player.xpToNext) {
                levelUp();
            }
            break;
    }
    
    addMessage(treasure.message);
}

// Explore ruins
function exploreRuins() {
    const ruinEvents = [
        {
            message: "You study ancient cartographer markings on the walls.",
            effect: () => {
                gameState.player.xp += 30;
                if (gameState.player.xp >= gameState.player.xpToNext) levelUp();
            }
        },
        {
            message: "You find a forgotten ink well, still containing precious ink.",
            effect: () => {
                gameState.player.ink = Math.min(gameState.player.maxInk, gameState.player.ink + 15);
            }
        },
        {
            message: "The ruins whisper secrets of the world before the fog.",
            effect: () => {
                gameState.player.maxInk += 5;
                gameState.player.ink += 5;
            }
        }
    ];
    
    const event = ruinEvents[Math.floor(Math.random() * ruinEvents.length)];
    addMessage(event.message);
    event.effect();
}

// Use items
function useItem(type) {
    if (gameState.combat.active) return;
    
    if (type === 'health') {
        if (gameState.player.potions <= 0) {
            addMessage("You don't have any health potions!");
            return;
        }
        
        if (gameState.player.health >= gameState.player.maxHealth) {
            addMessage("You're already at full health!");
            return;
        }
        
        const healAmount = 40 + Math.floor(Math.random() * 21); // 40-60 healing
        gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + healAmount);
        gameState.player.potions--;
        
        addMessage(`You drink a health potion and recover ${healAmount} health!`);
    }
    
    if (type === 'ink') {
        if (gameState.player.inkVials <= 0) {
            addMessage("You don't have any ink vials!");
            return;
        }
        
        if (gameState.player.ink >= gameState.player.maxInk) {
            addMessage("Your ink supply is already full!");
            return;
        }
        
        const inkAmount = 25 + Math.floor(Math.random() * 16); // 25-40 ink
        gameState.player.ink = Math.min(gameState.player.maxInk, gameState.player.ink + inkAmount);
        gameState.player.inkVials--;
        
        addMessage(`You refill your ink supply! Gained ${inkAmount} ink.`);
    }
    
    updateDisplay();
}

// Save game
function saveGame() {
    try {
        const saveData = JSON.stringify(gameState);
        localStorage.setItem('lastCartographerSave', saveData);
        addMessage("Game saved successfully!");
    } catch (error) {
        addMessage("Failed to save game. Your browser might not support local storage.");
    }
}

// Load game
function loadGame() {
    try {
        const saveData = localStorage.getItem('lastCartographerSave');
        if (saveData) {
            gameState = JSON.parse(saveData);
            updateDisplay();
            addMessage("Game loaded successfully!");
        } else {
            addMessage("No saved game found.");
        }
    } catch (error) {
        addMessage("Failed to load game. Save file might be corrupted.");
    }
}

// Restart game
function restartGame() {
    // Reset game state
    gameState = {
        player: {
            x: 7,
            y: 7,
            level: 1,
            xp: 0,
            xpToNext: 100,
            health: 100,
            maxHealth: 100,
            ink: 50,
            maxInk: 50,
            attack: 10,
            defense: 5,
            potions: 3,
            inkVials: 2
        },
        map: {
            width: 15,
            height: 15,
            cells: [],
            explored: []
        },
        combat: {
            active: false,
            enemy: null,
            playerDefending: false,
            turn: 'player'
        }
    };
    
    document.getElementById('combat-screen').classList.add('hidden');
    initGame();
}

// Update display
function updateDisplay() {
    updatePlayerStats();
    updateInventory();
    updateMap();
}

// Update player stats
function updatePlayerStats() {
    document.getElementById('player-level').textContent = gameState.player.level;
    document.getElementById('player-xp').textContent = gameState.player.xp;
    document.getElementById('player-xp-max').textContent = gameState.player.xpToNext;
    document.getElementById('player-attack').textContent = gameState.player.attack;
    document.getElementById('player-defense').textContent = gameState.player.defense;
    
    // Update health bar
    const healthPercent = (gameState.player.health / gameState.player.maxHealth) * 100;
    document.getElementById('health-bar').style.width = healthPercent + '%';
    document.getElementById('health-text').textContent = `${gameState.player.health}/${gameState.player.maxHealth}`;
    
    // Update ink bar
    const inkPercent = (gameState.player.ink / gameState.player.maxInk) * 100;
    document.getElementById('ink-bar').style.width = inkPercent + '%';
    document.getElementById('ink-text').textContent = `${gameState.player.ink}/${gameState.player.maxInk}`;
}

// Update inventory
function updateInventory() {
    document.getElementById('health-potions').textContent = gameState.player.potions;
    document.getElementById('ink-vials').textContent = gameState.player.inkVials;
    
    // Enable/disable buttons
    document.getElementById('use-health-potion').disabled = gameState.player.potions <= 0 || gameState.player.health >= gameState.player.maxHealth;
    document.getElementById('use-ink-vial').disabled = gameState.player.inkVials <= 0 || gameState.player.ink >= gameState.player.maxInk;
}

// Update map
function updateMap() {
    const mapElement = document.getElementById('game-map');
    mapElement.innerHTML = '';
    
    for (let y = 0; y < gameState.map.height; y++) {
        for (let x = 0; x < gameState.map.width; x++) {
            const cell = document.createElement('div');
            cell.className = 'map-cell';
            
            if (x === gameState.player.x && y === gameState.player.y) {
                cell.classList.add('player');
                cell.textContent = mapSymbols.player;
            } else if (gameState.map.explored[y][x]) {
                const cellType = gameState.map.cells[y][x];
                
                switch(cellType) {
                    case 'enemy':
                        cell.classList.add('enemy');
                        cell.textContent = mapSymbols.enemy;
                        break;
                    case 'treasure':
                        cell.classList.add('treasure');
                        cell.textContent = mapSymbols.treasure;
                        break;
                    case 'wall':
                        cell.classList.add('wall');
                        cell.textContent = mapSymbols.wall;
                        break;
                    case 'ruins':
                        cell.classList.add('ruins');
                        cell.textContent = mapSymbols.ruins;
                        break;
                    default:
                        cell.classList.add('explored');
                        cell.textContent = mapSymbols.explored;
                }
            } else {
                cell.classList.add('fog');
                cell.textContent = mapSymbols.fog;
            }
            
            mapElement.appendChild(cell);
        }
    }
}

// Update combat display
function updateCombatDisplay() {
    if (!gameState.combat.active || !gameState.combat.enemy) return;
    
    const enemy = gameState.combat.enemy;
    const healthPercent = (enemy.health / enemy.maxHealth) * 100;
    
    document.getElementById('enemy-health-bar').style.width = healthPercent + '%';
    document.getElementById('enemy-health-text').textContent = `${enemy.health}/${enemy.maxHealth}`;
    
    updatePlayerStats();
    updateInventory();
    
    // Enable/disable combat buttons
    const isPlayerTurn = gameState.combat.turn === 'player';
    document.getElementById('attack-btn').disabled = !isPlayerTurn;
    document.getElementById('defend-btn').disabled = !isPlayerTurn;
    document.getElementById('potion-btn').disabled = !isPlayerTurn || gameState.player.potions <= 0;
    document.getElementById('skill-btn').disabled = !isPlayerTurn || gameState.player.ink < 10;
}

// Add message to log
function addMessage(message) {
    const messageLog = document.getElementById('message-log');
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = message;
    
    messageLog.appendChild(messageElement);
    messageLog.scrollTop = messageLog.scrollHeight;
    
    // Keep only last 10 messages
    while (messageLog.children.length > 10) {
        messageLog.removeChild(messageLog.firstChild);
    }
}

// Add combat log entry
function addCombatLog(message, className = '') {
    const combatLog = document.getElementById('combat-log');
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry ' + className;
    logEntry.textContent = message;
    
    combatLog.appendChild(logEntry);
    combatLog.scrollTop = combatLog.scrollHeight;
}

// Clear combat log
function clearCombatLog() {
    document.getElementById('combat-log').innerHTML = '';
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', initGame);