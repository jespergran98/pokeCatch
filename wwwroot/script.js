// Game state
let caughtPokemon = [];
let spawnInterval;
let currentFilter = 'all';
let grassPatches = [];

// DOM elements
const gameArea = document.getElementById('game-area');
const pokedexBtn = document.getElementById('pokedex-btn');
const pokedexModal = document.getElementById('pokedex-modal');
const pokedexList = document.getElementById('pokedex-list');
const closeModal = document.querySelector('.close');
const scoreCount = document.getElementById('score-count');
const catchNotification = document.getElementById('catch-notification');
const catchText = document.getElementById('catch-text');
const showAllBtn = document.getElementById('show-all');
const showFavoritesBtn = document.getElementById('show-favorites');

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    initializeGrassPatches();
    startPokemonSpawning();
    loadPokedex();
    setupEventListeners();
});

function setupEventListeners() {
    pokedexBtn.addEventListener('click', openPokedex);
    closeModal.addEventListener('click', closePokedex);
    showAllBtn.addEventListener('click', () => setFilter('all'));
    showFavoritesBtn.addEventListener('click', () => setFilter('favorites'));
    
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
        if (document.querySelectorAll('.pokemon-sprite').length < 6) {
            spawnRandomPokemon();
        }
    }, 2500);
}

// Function to get random Pokemon from PokéAPI
async function getRandomPokemon() {
    try {
        // Use a more focused range for better known Pokemon (Gen 1-4)
        const randomId = Math.floor(Math.random() * 493) + 1;
        
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch Pokemon data');
        }
        
        const pokemonData = await response.json();
        
        // Get the primary type (first type in the array)
        const primaryType = pokemonData.types[0].type.name;
        
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
        
        return {
            name: formattedName,
            type: formattedType,
            image: sprite
        };
    } catch (error) {
        console.error('Error fetching random Pokemon:', error);
        // Fallback to classic Pokemon if API fails
        const fallbackPokemon = [
            { name: 'Pikachu', type: 'Electric', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
            { name: 'Charizard', type: 'Fire', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png' },
            { name: 'Blastoise', type: 'Water', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png' },
            { name: 'Venusaur', type: 'Grass', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png' }
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
        
        // Spawn near grass patches for more realistic feel
        const grassPatch = getRandomGrassPatch();
        const grassRect = grassPatch.getBoundingClientRect();
        const gameRect = gameArea.getBoundingClientRect();
        
        // Calculate relative position to grass patch with some randomness
        const offsetX = (Math.random() - 0.5) * 100; // Random offset within 100px
        const offsetY = (Math.random() - 0.5) * 100;
        
        const relativeX = grassRect.left - gameRect.left + offsetX;
        const relativeY = grassRect.top - gameRect.top + offsetY;
        
        // Keep Pokemon within game area bounds
        const maxX = gameArea.clientWidth - 64;
        const maxY = gameArea.clientHeight - 64;
        
        sprite.style.left = Math.max(0, Math.min(relativeX, maxX)) + 'px';
        sprite.style.top = Math.max(0, Math.min(relativeY, maxY)) + 'px';
        
        // Add click event to catch pokemon
        sprite.addEventListener('click', () => catchPokemon(pokemon, sprite));
        
        // Add grass rustling effect when Pokemon spawns
        grassPatch.style.animation = 'grassSway 0.5s ease-in-out 3';
        
        gameArea.appendChild(sprite);
        
        // Remove sprite after 10 seconds if not caught
        setTimeout(() => {
            if (sprite.parentNode) {
                sprite.style.animation = 'pokemonFlee 1s ease-in forwards';
                setTimeout(() => {
                    if (sprite.parentNode) {
                        sprite.remove();
                    }
                }, 1000);
            }
        }, 10000);
    } catch (error) {
        console.error('Error spawning Pokemon:', error);
    }
}

async function catchPokemon(pokemon, sprite) {
    sprite.classList.add('catching');
    sprite.style.pointerEvents = 'none'; // Prevent multiple clicks
    
    try {
        const response = await fetch('/api/pokemon/catch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: pokemon.name,
                type: pokemon.type,
                imageUrl: pokemon.image
            })
        });
        
        if (response.ok) {
            const caughtPokemonData = await response.json();
            showCatchNotification(`Caught ${pokemon.name}!`);
            updateScore();
            
            // Add sparkle effect
            createSparkleEffect(sprite);
            
            setTimeout(() => {
                sprite.remove();
            }, 600);
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

function createSparkleEffect(element) {
    const rect = element.getBoundingClientRect();
    const gameRect = gameArea.getBoundingClientRect();
    
    for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        sparkle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: #ffd700;
            border-radius: 50%;
            pointer-events: none;
            z-index: 10;
            left: ${rect.left - gameRect.left + 32}px;
            top: ${rect.top - gameRect.top + 32}px;
            animation: sparkle 0.6s ease-out forwards;
            animation-delay: ${i * 0.1}s;
        `;
        
        // Random direction for each sparkle
        const angle = (i / 8) * Math.PI * 2;
        const distance = 30 + Math.random() * 20;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance;
        
        sparkle.style.setProperty('--endX', endX + 'px');
        sparkle.style.setProperty('--endY', endY + 'px');
        
        gameArea.appendChild(sparkle);
        
        setTimeout(() => {
            if (sparkle.parentNode) {
                sparkle.remove();
            }
        }, 700);
    }
}

function showCatchNotification(message) {
    catchText.textContent = message;
    catchNotification.classList.add('show');
    
    setTimeout(() => {
        catchNotification.classList.remove('show');
    }, 2500);
}

async function updateScore() {
    try {
        const response = await fetch('/api/pokemon');
        if (response.ok) {
            const pokemon = await response.json();
            scoreCount.textContent = pokemon.length;
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
            caughtPokemon = await response.json();
            displayPokedex();
            updateScore();
        }
    } catch (error) {
        console.error('Error loading Pokedex:', error);
    }
}

function displayPokedex() {
    pokedexList.innerHTML = '';
    
    if (caughtPokemon.length === 0) {
        const message = currentFilter === 'favorites' ? 
            'No favorite Pokémon yet! Mark some as favorites by clicking the ★ button!' : 
            'No Pokémon caught yet! Go explore the grass patches and catch some wild Pokémon!';
        pokedexList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #7f8c8d;">
                <div style="font-size: 3em; margin-bottom: 20px;">📱</div>
                <p style="font-size: 1.1em; line-height: 1.4;">${message}</p>
            </div>
        `;
        return;
    }
    
    caughtPokemon.forEach(pokemon => {
        const card = createPokemonCard(pokemon);
        pokedexList.appendChild(card);
    });
}

function createPokemonCard(pokemon) {
    const card = document.createElement('div');
    card.className = `pokemon-card ${pokemon.isFavorite ? 'favorite' : ''}`;
    
    const imageUrl = pokemon.imageUrl || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
    
    card.innerHTML = `
        <div class="pokemon-image">
            <img src="${imageUrl}" alt="${pokemon.name}" style="width: 64px; height: 64px;" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'">
        </div>
        <div class="pokemon-header">
            <div class="pokemon-name" id="name-${pokemon.id}">${pokemon.name}</div>
            <button class="favorite-btn" onclick="toggleFavorite(${pokemon.id})" title="${pokemon.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                ${pokemon.isFavorite ? '★' : '☆'}
            </button>
        </div>
        <div class="pokemon-type">Type: ${pokemon.type}</div>
        <div class="pokemon-caught">Caught: ${new Date(pokemon.caughtAt).toLocaleDateString()}</div>
        <div class="pokemon-actions">
            <button class="action-btn edit-btn" onclick="editPokemonName(${pokemon.id})" title="Rename this Pokémon">Rename</button>
            <button class="action-btn delete-btn" onclick="deletePokemon(${pokemon.id})" title="Release this Pokémon">Release</button>
        </div>
    `;
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
            padding: 4px; 
            border: 2px solid #3498db;
            border-radius: 4px;
            background: white;
            font-family: 'Courier New', monospace;
        ">
        <div style="margin-top: 8px; display: flex; gap: 5px;">
            <button class="action-btn save-btn" onclick="savePokemonName(${pokemonId})">Save</button>
            <button class="action-btn cancel-btn" onclick="cancelEdit(${pokemonId}, '${currentName.replace(/'/g, "\\'")}')">Cancel</button>
        </div>
    `;
    
    const input = document.getElementById(`input-${pokemonId}`);
    input.focus();
    input.select();
    
    // Handle Enter key
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            savePokemonName(pokemonId);
        } else if (e.key === 'Escape') {
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
    if (!confirm('Are you sure you want to release this Pokémon back into the wild? This action cannot be undone!')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/pokemon/${pokemonId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadPokedex();
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'Failed to release Pokémon');
        }
    } catch (error) {
        console.error('Error releasing Pokémon:', error);
        alert('Error releasing Pokémon');
    }
}

function openPokedex() {
    loadPokedex();
    pokedexModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closePokedex() {
    pokedexModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

function setFilter(filter) {
    currentFilter = filter;
    
    // Update button states
    showAllBtn.classList.remove('active');
    showFavoritesBtn.classList.remove('active');
    
    if (filter === 'all') {
        showAllBtn.classList.add('active');
    } else {
        showFavoritesBtn.classList.add('active');
    }
    
    loadPokedex();
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes pokemonFlee {
        0% { 
            transform: scale(1) translateY(0px);
            opacity: 1;
        }
        100% { 
            transform: scale(0.5) translateY(-50px);
            opacity: 0;
        }
    }
    
    @keyframes sparkle {
        0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(var(--endX), var(--endY)) scale(0);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);