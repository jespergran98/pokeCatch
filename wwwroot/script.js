// Game state
let caughtPokemon = [];
let spawnInterval;
let currentFilter = 'all';
let currentSort = 'recent';
let currentView = 'grid';
let currentSearch = '';
let grassPatches = [];

// DOM elements
const gameArea = document.getElementById('game-area');
const pokedexBtn = document.getElementById('pokedex-btn');
const pokedexModal = document.getElementById('pokedex-modal');
const pokedexList = document.getElementById('pokedex-list');
const closeModal = document.querySelector('.close');
const scoreCount = document.getElementById('score-count');
const speciesCount = document.getElementById('species-count');
const catchNotification = document.getElementById('catch-notification');
const catchText = document.getElementById('catch-text');
const catchSubtext = document.getElementById('catch-subtext');
const pokemonCountDisplay = document.getElementById('pokemon-count-display');
const sortSelect = document.getElementById('sort-select');
const searchInput = document.getElementById('search-input');

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    initializeGrassPatches();
    startPokemonSpawning();
    loadPokedex();
    setupEventListeners();
    updatePokemonTypeColors();
});

function setupEventListeners() {
    pokedexBtn.addEventListener('click', openPokedex);
    closeModal.addEventListener('click', closePokedex);
    
    // Handle Enter and Escape keys for release modal
    document.addEventListener('keydown', function(e) {
        const releaseModal = document.getElementById('release-modal');
        if (releaseModal.style.display === 'block') {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.querySelector('.confirm-release-btn').click();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                document.querySelector('.cancel-release-btn').click();
            }
        }
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });
    
    // View toggle buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => setView(btn.dataset.view));
    });
    
    // Sort dropdown
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            displayPokedex();
        });
    }
    
    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            displayPokedex();
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === pokedexModal) {
            closePokedex();
        }
    });
}

function initializeGrassPatches() {
    grassPatches = document.querySelectorAll('.grass-patch');
}

function getRandomGrassPatch() {
    return grassPatches[Math.floor(Math.random() * grassPatches.length)];
}

function startPokemonSpawning() {
    spawnInterval = setInterval(() => {
        if (document.querySelectorAll('.pokemon-sprite').length < 5) {
            spawnRandomPokemon();
        }
    }, 2000); // Spawn every 2 seconds for more action
}

// Enhanced Pokemon data with rarity system
function getPokemonRarity(pokemonId) {
    if (pokemonId >= 1 && pokemonId <= 151) {
        // Gen 1 rarity distribution
        const legendaries = [144, 145, 146, 150, 151];
        const rares = [1, 4, 7, 25, 94, 130, 131, 142];
        const uncommons = [2, 5, 8, 26, 59, 65, 68, 78, 89, 103, 106, 107, 113, 115, 128, 132, 134, 135, 136];
        
        if (legendaries.includes(pokemonId)) return 'legendary';
        if (rares.includes(pokemonId)) return 'rare';
        if (uncommons.includes(pokemonId)) return 'uncommon';
        return 'common';
    }
    
    // For other generations, use a probability-based system
    const rand = Math.random();
    if (rand < 0.01) return 'legendary';
    if (rand < 0.05) return 'epic';
    if (rand < 0.15) return 'rare';
    if (rand < 0.35) return 'uncommon';
    return 'common';
}

// Function to get random Pokemon from PokéAPI with enhanced data
async function getRandomPokemon() {
    try {
        // Use a more focused range for better known Pokemon (Gen 1-4)
        const randomId = Math.floor(Math.random() * 1025) + 1;
        
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch Pokemon data');
        }
        
        const pokemonData = await response.json();
        
        // Get the primary type (first type in the array)
        const primaryType = pokemonData.types[0].type.name;
        const secondaryType = pokemonData.types[1]?.type.name || null;
        
        // Capitalize first letter and handle special cases
        const formattedName = pokemonData.name
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('-');
        const formattedType = primaryType.charAt(0).toUpperCase() + primaryType.slice(1);
        
        // Prefer the default sprite, fallback to alternatives
        const sprite = pokemonData.sprites.front_default || 
                      pokemonData.sprites.front_shiny || 
                      pokemonData.sprites.other?.['official-artwork']?.front_default;
        
        const rarity = getPokemonRarity(randomId);
        
        return {
            name: formattedName,
            type: formattedType,
            secondaryType: secondaryType ? secondaryType.charAt(0).toUpperCase() + secondaryType.slice(1) : null,
            image: sprite,
            collectorNumber: randomId,
            rarity: rarity
        };
    } catch (error) {
        console.error('Error fetching random Pokemon:', error);
        // Enhanced fallback Pokemon with rarity
        const fallbackPokemon = [
            { name: 'Pikachu', type: 'Electric', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png', collectorNumber: 25, rarity: 'rare' },
            { name: 'Charizard', type: 'Fire', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png', collectorNumber: 6, rarity: 'rare' },
            { name: 'Blastoise', type: 'Water', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png', collectorNumber: 9, rarity: 'rare' },
            { name: 'Venusaur', type: 'Grass', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png', collectorNumber: 3, rarity: 'rare' }
        ];
        return fallbackPokemon[Math.floor(Math.random() * fallbackPokemon.length)];
    }
}

async function spawnRandomPokemon() {
    try {
        const pokemon = await getRandomPokemon();
        
        if (!pokemon.image) {
            console.log('No sprite available for this Pokemon, skipping...');
            return;
        }
        
        const sprite = document.createElement('div');
        sprite.className = 'pokemon-sprite';
        sprite.style.backgroundImage = `url(${pokemon.image})`;
        
        // Add rarity-based visual effects
        if (pokemon.rarity === 'legendary') {
            sprite.classList.add('legendary-glow');
        } else if (pokemon.rarity === 'epic') {
            sprite.classList.add('epic-glow');
        } else if (pokemon.rarity === 'rare') {
            sprite.classList.add('rare-glow');
        }
        
        // Enhanced spawning logic with better positioning
        const grassPatch = getRandomGrassPatch();
        const grassRect = grassPatch.getBoundingClientRect();
        const gameRect = gameArea.getBoundingClientRect();
        
        // Calculate relative position to grass patch with some randomness
        const offsetX = (Math.random() - 0.5) * 80;
        const offsetY = (Math.random() - 0.5) * 80;
        
        const relativeX = grassRect.left - gameRect.left + offsetX;
        const relativeY = grassRect.top - gameRect.top + offsetY;
        
        // Keep Pokemon within game area bounds (accounting for larger sprite size)
        const maxX = gameArea.clientWidth - 96;
        const maxY = gameArea.clientHeight - 96;
        
        sprite.style.left = Math.max(0, Math.min(relativeX, maxX)) + 'px';
        sprite.style.top = Math.max(0, Math.min(relativeY, maxY)) + 'px';
        
        // Add click event to catch pokemon
        sprite.addEventListener('click', () => catchPokemon(pokemon, sprite));
        
        // Add grass rustling effect when Pokemon spawns
        grassPatch.style.animation = 'grassSway 0.5s ease-in-out 3';
        
        gameArea.appendChild(sprite);
        
        // Remove sprite after 12 seconds if not caught (longer for rare Pokemon)
        const timeoutDuration = pokemon.rarity === 'legendary' ? 20000 : 
                               pokemon.rarity === 'epic' ? 16000 : 
                               pokemon.rarity === 'rare' ? 14000 : 12000;
        
        setTimeout(() => {
            if (sprite.parentNode) {
                sprite.style.animation = 'pokemonFlee 1s ease-in forwards';
                setTimeout(() => {
                    if (sprite.parentNode) {
                        sprite.remove();
                    }
                }, 1000);
            }
        }, timeoutDuration);
    } catch (error) {
        console.error('Error spawning Pokemon:', error);
    }
}

async function catchPokemon(pokemon, sprite) {
    sprite.classList.add('catching');
    sprite.style.pointerEvents = 'none';
    
    try {
        const response = await fetch('/api/pokemon/catch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: pokemon.name,
                type: pokemon.type,
                imageUrl: pokemon.image,
                collectorNumber: pokemon.collectorNumber,
                rarity: pokemon.rarity
            })
        });
        
        if (response.ok) {
            const caughtPokemonData = await response.json();
            
            // Enhanced catch notification based on rarity
            let message = `Caught ${pokemon.name}!`;
            let subMessage = '';
            
            switch(pokemon.rarity) {
                case 'legendary':
                    message = `⭐ LEGENDARY CATCH! ⭐`;
                    subMessage = `You caught ${pokemon.name}!`;
                    break;
                case 'epic':
                    message = `💜 Epic Catch! 💜`;
                    subMessage = `You caught ${pokemon.name}!`;
                    break;
                case 'rare':
                    message = `💎 Rare Catch! 💎`;
                    subMessage = `You caught ${pokemon.name}!`;
                    break;
                case 'uncommon':
                    message = `🌟 Uncommon Catch!`;
                    subMessage = `You caught ${pokemon.name}!`;
                    break;
                default:
                    subMessage = `Type: ${pokemon.type}`;
            }
            
            showCatchNotification(message, subMessage);
            updateScore();
            
            // Enhanced sparkle effect based on rarity
            createSparkleEffect(sprite, pokemon.rarity);
            
            setTimeout(() => {
                sprite.remove();
            }, 800);
        } else {
            console.error('Failed to catch Pokemon');
            sprite.classList.remove('catching');
            sprite.style.pointerEvents = 'auto';
        }
    } catch (error) {
        console.error('Error catching Pokemon:', error);
        sprite.classList.remove('catching');
        sprite.style.pointerEvents = 'auto';
    }
}

function createSparkleEffect(element, rarity = 'common') {
    const rect = element.getBoundingClientRect();
    const gameRect = gameArea.getBoundingClientRect();
    
    const sparkleCount = rarity === 'legendary' ? 16 : 
                        rarity === 'epic' ? 12 : 
                        rarity === 'rare' ? 10 : 8;
    
    const colors = {
        'legendary': ['#ffd700', '#ff6347', '#ff1493', '#00ff7f'],
        'epic': ['#9370db', '#4169e1', '#ff69b4'],
        'rare': ['#00bfff', '#32cd32', '#ffd700'],
        'uncommon': ['#32cd32', '#ffd700'],
        'common': ['#ffd700']
    };
    
    const sparkleColors = colors[rarity] || colors['common'];
    
    for (let i = 0; i < sparkleCount; i++) {
        const sparkle = document.createElement('div');
        const color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
        
        sparkle.style.cssText = `
            position: absolute;
            width: ${rarity === 'legendary' ? '8px' : '4px'};
            height: ${rarity === 'legendary' ? '8px' : '4px'};
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 10;
            left: ${rect.left - gameRect.left + 48}px;
            top: ${rect.top - gameRect.top + 48}px;
            box-shadow: 0 0 ${rarity === 'legendary' ? '8px' : '4px'} ${color};
            animation: sparkle 1s ease-out forwards;
            animation-delay: ${i * 0.1}s;
        `;
        
        // Random direction for each sparkle
        const angle = (i / sparkleCount) * Math.PI * 2;
        const distance = 40 + Math.random() * 30;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance;
        
        sparkle.style.setProperty('--endX', endX + 'px');
        sparkle.style.setProperty('--endY', endY + 'px');
        
        gameArea.appendChild(sparkle);
        
        setTimeout(() => {
            if (sparkle.parentNode) {
                sparkle.remove();
            }
        }, 1100);
    }
}

function showCatchNotification(message, subMessage = '') {
    catchText.textContent = message;
    catchSubtext.textContent = subMessage;
    catchNotification.classList.add('show');
    
    setTimeout(() => {
        catchNotification.classList.remove('show');
    }, 3000);
}

async function updateScore() {
    try {
        const response = await fetch('/api/pokemon');
        if (response.ok) {
            const pokemon = await response.json();
            scoreCount.textContent = pokemon.length;
            
            // Calculate unique species count
            const uniqueSpecies = new Set(pokemon.map(p => p.name.toLowerCase())).size;
            speciesCount.textContent = uniqueSpecies;
        }
    } catch (error) {
        console.error('Error updating score:', error);
    }
}

async function loadPokedex() {
    try {
        let url = '/api/pokemon';
        if (currentFilter === 'favorites') {
            url = '/api/pokemon/favorites';
        }
        
        const response = await fetch(url);
        if (response.ok) {
            let pokemonData = await response.json();
            
            // Apply filtering
            if (currentFilter === 'duplicates') {
                const nameCounts = {};
                pokemonData.forEach(p => {
                    const name = p.name.toLowerCase();
                    nameCounts[name] = (nameCounts[name] || 0) + 1;
                });
                pokemonData = pokemonData.filter(p => nameCounts[p.name.toLowerCase()] > 1);
            }
            
            // Apply search filter
            if (currentSearch) {
                pokemonData = pokemonData.filter(p => 
                    p.name.toLowerCase().includes(currentSearch) ||
                    p.type.toLowerCase().includes(currentSearch)
                );
            }
            
            caughtPokemon = pokemonData;
            displayPokedex();
            updateScore();
        }
    } catch (error) {
        console.error('Error loading Pokedex:', error);
    }
}

function sortPokemon(pokemon) {
    const sorted = [...pokemon];
    
    switch(currentSort) {
        case 'collector':
            return sorted.sort((a, b) => (a.collectorNumber || 0) - (b.collectorNumber || 0));
        case 'name':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'type':
            return sorted.sort((a, b) => a.type.localeCompare(b.type));
        case 'rarity':
            const rarityOrder = { 'legendary': 0, 'epic': 1, 'rare': 2, 'uncommon': 3, 'common': 4 };
            return sorted.sort((a, b) => (rarityOrder[a.rarity] || 5) - (rarityOrder[b.rarity] || 5));
        case 'recent':
        default:
            return sorted.sort((a, b) => new Date(b.caughtAt) - new Date(a.caughtAt));
    }
}

function displayPokedex() {
    pokedexList.innerHTML = '';
    
    // Update view classes
    pokedexList.className = currentView === 'grid' ? 'pokemon-grid' : 'pokemon-list';
    
    if (caughtPokemon.length === 0) {
        const message = currentFilter === 'favorites' ? 
            'No favorite Pokémon yet! Mark some as favorites by clicking the ⭐ button!' :
            currentFilter === 'duplicates' ?
            'No duplicate Pokémon found! Catch more of the same species to see duplicates here!' :
            currentSearch ? 
            `No Pokémon found matching "${currentSearch}". Try a different search term!` :
            'No Pokémon caught yet! Go explore the grass patches and catch some wild Pokémon!';
            
        pokedexList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #7f8c8d;">
                <div style="font-size: 4em; margin-bottom: 20px;">📱</div>
                <p style="font-size: 1.2em; line-height: 1.6; max-width: 400px; margin: 0 auto;">${message}</p>
            </div>
        `;
        
        pokemonCountDisplay.textContent = '0 Pokémon registered';
        return;
    }
    
    // Group Pokémon by name to count duplicates
    const pokemonGroups = {};
    caughtPokemon.forEach(pokemon => {
        const key = pokemon.name.toLowerCase();
        if (!pokemonGroups[key]) {
            pokemonGroups[key] = {
                pokemon: pokemon,
                count: 1,
                allInstances: [pokemon]
            };
        } else {
            pokemonGroups[key].count++;
            pokemonGroups[key].allInstances.push(pokemon);
        }
    });
    
    const uniquePokemon = Object.values(pokemonGroups);
    const sortedPokemon = sortPokemon(uniquePokemon.map(group => ({
        ...group.pokemon,
        count: group.count,
        allInstances: group.allInstances
    })));
    
    pokemonCountDisplay.textContent = `${sortedPokemon.length} unique Pokémon registered`;
    
    sortedPokemon.forEach(pokemonGroup => {
        const card = createPokemonCard(pokemonGroup);
        pokedexList.appendChild(card);
    });
}

function createPokemonCard(pokemonGroup) {
    const pokemon = pokemonGroup;
    const card = document.createElement('div');
    card.className = `pokemon-card ${pokemon.isFavorite ? 'favorite' : ''} ${currentView === 'list' ? 'list-view' : ''}`;
    
    const imageUrl = pokemon.imageUrl || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
    
    // Enhanced card content based on view
    if (currentView === 'list') {
        card.innerHTML = `
            <div class="pokemon-image">
                <img src="${imageUrl}" alt="${pokemon.name}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'">
            </div>
            <div class="pokemon-content">
                <div class="pokemon-info-section">
                    <div class="pokemon-header">
                        <div class="pokemon-name" id="name-${pokemon.id}">${pokemon.name}</div>
                        ${pokemon.collectorNumber ? `<div class="pokemon-id">#${pokemon.collectorNumber.toString().padStart(3, '0')}</div>` : ''}
                        ${pokemon.count > 1 ? `<div class="pokemon-count">×${pokemon.count}</div>` : ''}
                    </div>
                    <div class="pokemon-details">
                        <div class="pokemon-type type-${pokemon.type.toLowerCase()}">${pokemon.type}</div>
                        <div class="pokemon-rarity rarity-${pokemon.rarity || 'common'}">${(pokemon.rarity || 'common').toUpperCase()}</div>
                        <div class="pokemon-caught">Caught: ${new Date(pokemon.caughtAt).toLocaleDateString()}</div>
                    </div>
                </div>
                <div class="pokemon-actions-section">
                    <button class="favorite-btn" onclick="toggleFavorite(${pokemon.id})" title="${pokemon.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        ${pokemon.isFavorite ? '⭐' : '☆'}
                    </button>
                    <div class="pokemon-actions">
                        <button class="action-btn edit-btn" onclick="editPokemonName(${pokemon.id})" title="Rename this Pokémon">Rename</button>
                        <button class="action-btn delete-btn" onclick="deletePokemon(${pokemon.id})" title="Release this Pokémon">Release</button>
                    </div>
                </div>
            </div>
        `;
    } else {
        card.innerHTML = `
            <div class="pokemon-image">
                <img src="${imageUrl}" alt="${pokemon.name}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'">
            </div>
            <div class="pokemon-header">
                <div class="pokemon-name-section">
                    <div class="pokemon-name" id="name-${pokemon.id}">${pokemon.name}</div>
                    ${pokemon.collectorNumber ? `<div class="pokemon-id">#${pokemon.collectorNumber.toString().padStart(3, '0')}</div>` : ''}
                    ${pokemon.count > 1 ? `<div class="pokemon-count">×${pokemon.count}</div>` : ''}
                </div>
                <button class="favorite-btn" onclick="toggleFavorite(${pokemon.id})" title="${pokemon.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                    ${pokemon.isFavorite ? '⭐' : '☆'}
                </button>
            </div>
            <div class="pokemon-type type-${pokemon.type.toLowerCase()}">${pokemon.type}</div>
            <div class="pokemon-info">
                <div class="pokemon-rarity rarity-${pokemon.rarity || 'common'}">${(pokemon.rarity || 'common').toUpperCase()}</div>
                <div class="pokemon-caught">Caught: ${new Date(pokemon.caughtAt).toLocaleDateString()}</div>
            </div>
            <div class="pokemon-actions">
                <button class="action-btn edit-btn" onclick="editPokemonName(${pokemon.id})" title="Rename this Pokémon">Rename</button>
                <button class="action-btn delete-btn" onclick="deletePokemon(${pokemon.id})" title="Release this Pokémon">Release</button>
            </div>
        `;
    }
    
    return card;
}

async function toggleFavorite(pokemonId) {
    try {
        const response = await fetch(`/api/pokemon/${pokemonId}/favorite`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            loadPokedex();
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}

function editPokemonName(pokemonId) {
    const nameElement = document.getElementById(`name-${pokemonId}`);
    const currentName = nameElement.textContent;
    
    nameElement.innerHTML = `
        <input type="text" value="${currentName}" id="input-${pokemonId}" style="
            width: 100%; 
            font-size: inherit; 
            padding: 6px 8px; 
            border: 2px solid #3498db;
            border-radius: 6px;
            background: white;
            font-family: 'Courier New', monospace;
            font-weight: bold;
        ">
        <div style="margin-top: 10px; display: flex; gap: 8px; justify-content: center;">
            <button class="action-btn save-btn" onclick="savePokemonName(${pokemonId})" style="flex: none; padding: 4px 12px; font-size: 0.8em;">Save</button>
            <button class="action-btn cancel-btn" onclick="cancelEdit(${pokemonId}, '${currentName.replace(/'/g, "\\'")}')">Cancel</button>
        </div>
    `;
    
    const input = document.getElementById(`input-${pokemonId}`);
    input.focus();
    input.select();
    
    // Handle Enter and Escape keys
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            savePokemonName(pokemonId);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit(pokemonId, currentName);
        }
    });
}

async function savePokemonName(pokemonId) {
    const input = document.getElementById(`input-${pokemonId}`);
    const newName = input.value.trim();
    
    if (!newName) {
        alert('Name cannot be empty!');
        return;
    }
    
    if (newName.length > 20) {
        alert('Name is too long! Please use 20 characters or fewer.');
        return;
    }
    
    try {
        const response = await fetch(`/api/pokemon/${pokemonId}/name`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newName: newName })
        });
        
        if (response.ok) {
            loadPokedex();
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'Failed to update name');
        }
    } catch (error) {
        console.error('Error updating name:', error);
        alert('Error updating name');
    }
}

function cancelEdit(pokemonId, originalName) {
    const nameElement = document.getElementById(`name-${pokemonId}`);
    nameElement.textContent = originalName;
}

async function deletePokemon(pokemonId) {
    // Find the Pokémon to display its name
    const pokemon = caughtPokemon.find(p => p.id === pokemonId);
    if (!pokemon) return;

    // Open the release confirmation modal
    openReleaseModal(pokemonId, pokemon.name);
}

function openReleaseModal(pokemonId, pokemonName) {
    const releaseModal = document.getElementById('release-modal');
    const releaseText = document.getElementById('release-text');
    const releasePokemonName = document.getElementById('release-pokemon-name');
    const confirmBtn = document.querySelector('.confirm-release-btn');
    const cancelBtn = document.querySelector('.cancel-release-btn');
    
    releaseText.textContent = 'Are you sure you want to release this Pokémon? This action cannot be undone!';
    releasePokemonName.textContent = pokemonName;
    releaseModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Remove previous listeners to prevent duplicates
    if (releaseModal.confirmHandler) {
        confirmBtn.removeEventListener('click', releaseModal.confirmHandler);
    }
    if (releaseModal.cancelHandler) {
        cancelBtn.removeEventListener('click', releaseModal.cancelHandler);
    }
    if (releaseModal.outsideClickHandler) {
        releaseModal.removeEventListener('click', releaseModal.outsideClickHandler);
    }
    
    // Define handlers
    const confirmHandler = async () => {
        try {
            console.log(`Sending DELETE request for Pokémon ID: ${pokemonId}`);
            const response = await fetch(`/api/pokemon/${pokemonId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                loadPokedex();
                showCatchNotification('Pokémon released!', `${pokemonName} has returned to the wild safely.`);
                closeReleaseModal();
            } else {
                const errorData = await response.json();
                console.error('Failed to release Pokémon:', {
                    pokemonId,
                    status: response.status,
                    error: errorData.error
                });
                alert(`Failed to release Pokémon: ${errorData.error || 'Unknown server error'}`);
            }
        } catch (error) {
            console.error('Network error releasing Pokémon:', {
                pokemonId,
                error: error.message
            });
            alert(`Network error releasing Pokémon: ${error.message}`);
        }
    };
    
    const cancelHandler = () => closeReleaseModal();
    
    const outsideClickHandler = (event) => {
        if (event.target === releaseModal) {
            closeReleaseModal();
        }
    };
    
    // Attach listeners and store handlers on the modal element
    confirmBtn.addEventListener('click', confirmHandler);
    cancelBtn.addEventListener('click', cancelHandler);
    releaseModal.addEventListener('click', outsideClickHandler);
    
    releaseModal.confirmHandler = confirmHandler;
    releaseModal.cancelHandler = cancelHandler;
    releaseModal.outsideClickHandler = outsideClickHandler;
}

function closeReleaseModal() {
    const releaseModal = document.getElementById('release-modal');
    const confirmBtn = document.querySelector('.confirm-release-btn');
    const cancelBtn = document.querySelector('.cancel-release-btn');
    
    releaseModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Remove event listeners
    if (releaseModal.confirmHandler) {
        confirmBtn.removeEventListener('click', releaseModal.confirmHandler);
        delete releaseModal.confirmHandler;
    }
    if (releaseModal.cancelHandler) {
        cancelBtn.removeEventListener('click', releaseModal.cancelHandler);
        delete releaseModal.cancelHandler;
    }
    if (releaseModal.outsideClickHandler) {
        releaseModal.removeEventListener('click', releaseModal.outsideClickHandler);
        delete releaseModal.outsideClickHandler;
    }
}

function openPokedex() {
    loadPokedex();
    pokedexModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closePokedex() {
    pokedexModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function setFilter(filter) {
    currentFilter = filter;
    
    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    loadPokedex();
}

function setView(view) {
    currentView = view;
    
    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        }
    });
    
    displayPokedex();
}

function updatePokemonTypeColors() {
    // This function adds type-specific styling dynamically
    const style = document.createElement('style');
    style.textContent = `
        .pokemon-type.type-normal { background: linear-gradient(135deg, #a8a878 0%, #9c9c6b 100%); }
        .pokemon-type.type-fire { background: linear-gradient(135deg, #f08030 0%, #dd6610 100%); }
        .pokemon-type.type-water { background: linear-gradient(135deg, #6890f0 0%, #386ceb 100%); }
        .pokemon-type.type-electric { background: linear-gradient(135deg, #f8d030 0%, #f0c20c 100%); }
        .pokemon-type.type-grass { background: linear-gradient(135deg, #78c850 0%, #5ca935 100%); }
        .pokemon-type.type-ice { background: linear-gradient(135deg, #98d8d8 0%, #69c6c6 100%); }
        .pokemon-type.type-fighting { background: linear-gradient(135deg, #c03028 0%, #9d2721 100%); }
        .pokemon-type.type-poison { background: linear-gradient(135deg, #a040a0 0%, #803380 100%); }
        .pokemon-type.type-ground { background: linear-gradient(135deg, #e0c068 0%, #d4a843 100%); }
        .pokemon-type.type-flying { background: linear-gradient(135deg, #a890f0 0%, #8e6eeb 100%); }
        .pokemon-type.type-psychic { background: linear-gradient(135deg, #f85888 0%, #f61c5d 100%); }
        .pokemon-type.type-bug { background: linear-gradient(135deg, #a8b820 0%, #8d9a1b 100%); }
        .pokemon-type.type-rock { background: linear-gradient(135deg, #b8a038 0%, #9c872d 100%); }
        .pokemon-type.type-ghost { background: linear-gradient(135deg, #705898 0%, #554080 100%); }
        .pokemon-type.type-dragon { background: linear-gradient(135deg, #7038f8 0%, #4c20d6 100%); }
        .pokemon-type.type-dark { background: linear-gradient(135deg, #705848 0%, #513f35 100%); }
        .pokemon-type.type-steel { background: linear-gradient(135deg, #b8b8d0 0%, #9090a8 100%); }
        .pokemon-type.type-fairy { background: linear-gradient(135deg, #ee99ac 0%, #e67387 100%); }
        
        /* Enhanced sprite effects for different rarities */
        .pokemon-sprite.legendary-glow {
            animation: pokemonIdle 2s ease-in-out infinite, legendaryGlow 3s ease-in-out infinite;
            filter: drop-shadow(0 0 15px #ffd700) drop-shadow(0 0 25px #ff6347);
        }
        
        .pokemon-sprite.epic-glow {
            animation: pokemonIdle 2.5s ease-in-out infinite, epicGlow 2.5s ease-in-out infinite;
            filter: drop-shadow(0 0 10px #9370db) drop-shadow(0 0 15px #4169e1);
        }
        
        .pokemon-sprite.rare-glow {
            animation: pokemonIdle 3s ease-in-out infinite, rareGlow 2s ease-in-out infinite;
            filter: drop-shadow(0 0 8px #00bfff) drop-shadow(0 0 12px #32cd32);
        }
        
        @keyframes legendaryGlow {
            0%, 100% { filter: drop-shadow(0 0 15px #ffd700) drop-shadow(0 0 25px #ff6347) brightness(1.2); }
            50% { filter: drop-shadow(0 0 25px #ff6347) drop-shadow(0 0 35px #ffd700) brightness(1.5); }
        }
        
        @keyframes epicGlow {
            0%, 100% { filter: drop-shadow(0 0 10px #9370db) drop-shadow(0 0 15px #4169e1) brightness(1.1); }
            50% { filter: drop-shadow(0 0 15px #4169e1) drop-shadow(0 0 20px #9370db) brightness(1.3); }
        }
        
        @keyframes rareGlow {
            0%, 100% { filter: drop-shadow(0 0 8px #00bfff) drop-shadow(0 0 12px #32cd32) brightness(1.05); }
            50% { filter: drop-shadow(0 0 12px #32cd32) drop-shadow(0 0 16px #00bfff) brightness(1.15); }
        }
        
        /* Enhanced Pokemon sprites - larger and more detailed */
        .pokemon-sprite {
            width: 120px;
            height: 120px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
            z-index: 10;
            animation: pokemonIdle 3s ease-in-out infinite;
            filter: drop-shadow(3px 3px 8px rgba(0,0,0,0.4));
        }
        
        .pokemon-sprite::before {
            content: '';
            position: absolute;
            bottom: 15px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 16px;
            background: radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 60%, transparent 100%);
            border-radius: 50%;
            z-index: -1;
        }
        
        .pokemon-sprite:hover {
            transform: scale(1.2) translateY(-10px);
            animation: pokemonExcited 0.6s ease-in-out infinite;
            filter: drop-shadow(3px 3px 8px rgba(0,0,0,0.4)) brightness(1.2) saturate(1.3);
            z-index: 15;
        }
        
        @keyframes pokemonIdle {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-6px) scale(1.02); }
        }
        
        @keyframes pokemonExcited {
            0%, 100% { transform: scale(1.2) translateY(-10px) rotate(-2deg); }
            50% { transform: scale(1.25) translateY(-15px) rotate(2deg); }
        }
    `;
    document.head.appendChild(style);
}

// Global functions for onclick handlers
window.toggleFavorite = toggleFavorite;
window.editPokemonName = editPokemonName;
window.savePokemonName = savePokemonName;
window.cancelEdit = cancelEdit;
window.deletePokemon = deletePokemon;

// Add additional CSS animations dynamically
const additionalStyle = document.createElement('style');
additionalStyle.textContent = `
    @keyframes pokemonFlee {
        0% { 
            transform: scale(1) translateY(0px);
            opacity: 1;
        }
        100% { 
            transform: scale(0.5) translateY(-60px);
            opacity: 0;
        }
    }
    
    @keyframes sparkle {
        0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translate(var(--endX), var(--endY)) scale(0) rotate(360deg);
            opacity: 0;
        }
    }
    
    /* Enhanced card hover effects */
    .pokemon-card:hover {
        transform: translateY(-8px) scale(1.03);
        box-shadow: 0 12px 25px rgba(0,0,0,0.4);
    }
    
    /* Responsive adjustments for larger sprites */
    @media (max-width: 768px) {
        .pokemon-sprite {
            width: 100px;
            height: 100px;
        }
        
        .pokemon-sprite::before {
            width: 70px;
            height: 14px;
            bottom: -12px;
        }
    }
`;
document.head.appendChild(additionalStyle);