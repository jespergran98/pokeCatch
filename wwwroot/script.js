// Game state
let caughtPokemon = [];
let spawnInterval;
let currentFilter = 'all';

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

function startPokemonSpawning() {
    spawnInterval = setInterval(() => {
        if (document.querySelectorAll('.pokemon-sprite').length < 5) {
            spawnRandomPokemon();
        }
    }, 2000);
}

// Function to get random Pokemon from PokéAPI
async function getRandomPokemon() {
    try {
        // There are about 1025 Pokemon as of Gen 9, so we'll use that range
        const randomId = Math.floor(Math.random() * 1025) + 1;
        
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch Pokemon data');
        }
        
        const pokemonData = await response.json();
        
        // Get the primary type (first type in the array)
        const primaryType = pokemonData.types[0].type.name;
        
        // Capitalize first letter
        const formattedName = pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1);
        const formattedType = primaryType.charAt(0).toUpperCase() + primaryType.slice(1);
        
        return {
            name: formattedName,
            type: formattedType,
            image: pokemonData.sprites.front_default || pokemonData.sprites.front_shiny
        };
    } catch (error) {
        console.error('Error fetching random Pokemon:', error);
        // Fallback to a basic Pokemon if API fails
        return {
            name: 'Pikachu',
            type: 'Electric',
            image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
        };
    }
}

async function spawnRandomPokemon() {
    try {
        const pokemon = await getRandomPokemon();
        const sprite = document.createElement('div');
        
        sprite.className = 'pokemon-sprite';
        sprite.style.backgroundImage = `url(${pokemon.image})`;
        
        // Get viewport dimensions for better positioning
        const maxX = Math.max(window.innerWidth - 100, 100);
        const maxY = Math.max(window.innerHeight - 200, 200);
        
        sprite.style.left = Math.random() * maxX + 'px';
        sprite.style.top = (Math.random() * (maxY - 200)) + 150 + 'px';
        
        // Add click event to catch pokemon
        sprite.addEventListener('click', () => catchPokemon(pokemon, sprite));
        
        gameArea.appendChild(sprite);
        
        // Remove sprite after 8 seconds if not caught
        setTimeout(() => {
            if (sprite.parentNode) {
                sprite.remove();
            }
        }, 8000);
    } catch (error) {
        console.error('Error spawning Pokemon:', error);
    }
}

async function catchPokemon(pokemon, sprite) {
    sprite.classList.add('catching');
    
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
            
            setTimeout(() => {
                sprite.remove();
            }, 500);
        } else {
            console.error('Failed to catch Pokemon');
            sprite.classList.remove('catching');
        }
    } catch (error) {
        console.error('Error catching Pokemon:', error);
        sprite.classList.remove('catching');
    }
}

function showCatchNotification(message) {
    catchText.textContent = message;
    catchNotification.classList.add('show');
    
    setTimeout(() => {
        catchNotification.classList.remove('show');
    }, 2000);
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
            'No favorite Pokemon yet! Mark some as favorites!' : 
            'No Pokemon caught yet! Go catch some!';
        pokedexList.innerHTML = `<p style="text-align: center; color: #7f8c8d; grid-column: 1/-1;">${message}</p>`;
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
            <img src="${imageUrl}" alt="${pokemon.name}" style="width: 64px; height: 64px;">
        </div>
        <div class="pokemon-header">
            <div class="pokemon-name" id="name-${pokemon.id}">${pokemon.name}</div>
            <button class="favorite-btn" onclick="toggleFavorite(${pokemon.id})">
                ${pokemon.isFavorite ? '⭐' : '☆'}
            </button>
        </div>
        <div class="pokemon-type">Type: ${pokemon.type}</div>
        <div class="pokemon-caught">Caught: ${new Date(pokemon.caughtAt).toLocaleDateString()}</div>
        <div class="pokemon-actions">
            <button class="action-btn edit-btn" onclick="editPokemonName(${pokemon.id})">Rename</button>
            <button class="action-btn delete-btn" onclick="deletePokemon(${pokemon.id})">Release</button>
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
        <input type="text" value="${currentName}" id="input-${pokemonId}" style="width: 100%; font-size: inherit; padding: 2px;">
        <div style="margin-top: 5px;">
            <button class="action-btn save-btn" onclick="savePokemonName(${pokemonId})">Save</button>
            <button class="action-btn cancel-btn" onclick="cancelEdit(${pokemonId}, '${currentName}')">Cancel</button>
        </div>
    `;
    
    const input = document.getElementById(`input-${pokemonId}`);
    input.focus();
    input.select();
}

async function savePokemonName(pokemonId) {
    const input = document.getElementById(`input-${pokemonId}`);
    const newName = input.value.trim();
    
    if (!newName) {
        alert('Name cannot be empty!');
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
    if (!confirm('Are you sure you want to release this Pokémon?')) {
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
            alert(errorData.error || 'Failed to release Pokemon');
        }
    } catch (error) {
        console.error('Error releasing Pokemon:', error);
        alert('Error releasing Pokemon');
    }
}

function openPokedex() {
    loadPokedex();
    pokedexModal.style.display = 'block';
}

function closePokedex() {
    pokedexModal.style.display = 'none';
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