// JavaScript principal pour l'application e-commerce CHIVAS SHOP

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation
    initializeApp();
    
    // Event listeners
    setupEventListeners();
    
    // Animations
    initializeAnimations();
});

function initializeApp() {
    // Initialiser le compteur du panier
    updateCartCount();
    
    // Initialiser le carrousel
    initializeCarousel();
    
    // Initialiser les tooltips Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialiser les popovers Bootstrap
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

function initializeCarousel() {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return; // Sortir si aucun carrousel n'est présent

    const items = carousel.querySelectorAll('.carousel-item');
    if (items.length === 0) return;

    let currentIndex = 0;

    function showNextItem() {
        items[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % items.length;
        items[currentIndex].classList.add('active');
    }

    // Afficher le premier élément immédiatement
    items[currentIndex].classList.add('active');

    // Changer d'image toutes les 5 secondes (ajustable si nécessaire)
    setInterval(showNextItem, 5000);
}

function setupEventListeners() {
    // Boutons "Ajouter au panier"
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart') || e.target.closest('.add-to-cart')) {
            e.preventDefault();
            handleAddToCart(e);
        }
    });
    
    // Formulaire d'ajout au panier sur la page produit
    const addToCartForm = document.querySelector('.add-to-cart-form');
    if (addToCartForm) {
        addToCartForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleProductPageAddToCart(e);
        });
    }
    
    // Contrôles de quantité
    setupQuantityControls();
    
    // Mise à jour du panier
    setupCartControls();
    
    // Recherche en temps réel
    setupSearchFeatures();
    
    // Filtres de produits
    setupProductFilters();
}

function handleAddToCart(e) {
    const button = e.target.classList.contains('add-to-cart') ? e.target : e.target.closest('.add-to-cart');
    const productId = button.getAttribute('data-product-id');

    if (!productId) return;

    // Animation du bouton
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Ajout...';
    button.disabled = true;

    // Requête AJAX
    fetch(`${BASE_URL}cart/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `product_id=${productId}&quantity=1&ajax=1&csrf_token=${encodeURIComponent(CSRF_TOKEN)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Mise à jour du compteur
            updateCartCount(data.cartCount);

            // Animation de succès
            button.innerHTML = '<i class="fas fa-check me-1"></i>Ajouté!';
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-success');

            // Notification toast
            showToast('Produit ajouté au panier avec succès!', 'success');

            // Restaurer le bouton après 2 secondes
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('btn-success');
                button.classList.add('btn-outline-primary');
                button.disabled = false;
            }, 2000);
        } else {
            throw new Error(data.message || 'Erreur lors de l\'ajout au panier');
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        button.innerHTML = originalText;
        button.disabled = false;
        showToast('Erreur lors de l\'ajout au panier', 'error');
    });
}

function handleProductPageAddToCart(e) {
    const form = e.target;
    const productId = form.querySelector('button[data-product-id]').getAttribute('data-product-id');
    const quantity = form.querySelector('#quantity').value;
    const button = form.querySelector('button[type="submit"]');

    // Animation du bouton
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Ajout en cours...';
    button.disabled = true;

    // Requête AJAX
    fetch(`${BASE_URL}cart/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `product_id=${productId}&quantity=${quantity}&ajax=1&csrf_token=${encodeURIComponent(CSRF_TOKEN)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateCartCount(data.cartCount);
            button.innerHTML = '<i class="fas fa-check me-2"></i>Ajouté au panier!';
            button.classList.remove('btn-primary');
            button.classList.add('btn-success');

            showToast(`${quantity} produit(s) ajouté(s) au panier!`, 'success');

            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('btn-success');
                button.classList.add('btn-primary');
                button.disabled = false;
            }, 3000);
        } else {
            throw new Error(data.message || 'Erreur lors de l\'ajout au panier');
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        button.innerHTML = originalText;
        button.disabled = false;
        showToast('Erreur lors de l\'ajout au panier', 'error');
    });
}

function setupQuantityControls() {
    // Contrôles de quantité sur la page produit
    const decreaseBtn = document.getElementById('decrease-qty');
    const increaseBtn = document.getElementById('increase-qty');
    const quantityInput = document.getElementById('quantity');
    
    if (decreaseBtn && increaseBtn && quantityInput) {
        decreaseBtn.addEventListener('click', function() {
            let currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                animateQuantityChange(quantityInput);
            }
        });
        
        increaseBtn.addEventListener('click', function() {
            let currentValue = parseInt(quantityInput.value);
            if (currentValue < 99) {
                quantityInput.value = currentValue + 1;
                animateQuantityChange(quantityInput);
            }
        });
        
        quantityInput.addEventListener('change', function() {
            let value = parseInt(this.value);
            if (isNaN(value) || value < 1) {
                this.value = 1;
            } else if (value > 99) {
                this.value = 99;
            }
            animateQuantityChange(this);
        });
    }
}

function setupCartControls() {
    // Mise à jour de quantité dans le panier
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('update-quantity')) {
            e.preventDefault();
            handleQuantityUpdate(e);
        }
        
        if (e.target.classList.contains('remove-item')) {
            e.preventDefault();
            handleRemoveItem(e);
        }
    });
    
    // Input de quantité dans le panier
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('quantity-input')) {
            handleQuantityInputChange(e);
        }
    });
}

function handleQuantityUpdate(e) {
    const button = e.target;
    const productId = button.getAttribute('data-product-id');
    const action = button.getAttribute('data-action');
    const quantityInput = document.querySelector(`input[data-product-id="${productId}"]`);
    
    let newQuantity = parseInt(quantityInput.value);
    if (action === 'increase') {
        newQuantity++;
    } else if (action === 'decrease' && newQuantity > 1) {
        newQuantity--;
    }
    
    updateCartQuantity(productId, newQuantity, quantityInput);
}

function handleQuantityInputChange(e) {
    const input = e.target;
    const productId = input.getAttribute('data-product-id');
    let quantity = parseInt(input.value);
    
    if (isNaN(quantity) || quantity < 1) {
        quantity = 1;
        input.value = 1;
    }
    
    updateCartQuantity(productId, quantity, input);
}

function updateCartQuantity(productId, quantity, inputElement) {
    // Animation de chargement
    inputElement.classList.add('loading');

    fetch(`${BASE_URL}cart/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `product_id=${productId}&quantity=${quantity}&ajax=1&csrf_token=${encodeURIComponent(CSRF_TOKEN)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            inputElement.value = quantity;
            // Recharger la page pour mettre à jour les totaux
            location.reload();
        } else {
            throw new Error('Erreur lors de la mise à jour');
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        showToast('Erreur lors de la mise à jour', 'error');
    })
    .finally(() => {
        inputElement.classList.remove('loading');
    });
}

function handleRemoveItem(e) {
    const button = e.target;
    const productId = button.getAttribute('data-product-id');

    if (confirm('Êtes-vous sûr de vouloir supprimer cet article du panier ?')) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        button.disabled = true;

        fetch(`${BASE_URL}cart/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `product_id=${productId}&ajax=1&csrf_token=${encodeURIComponent(CSRF_TOKEN)}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Animation de suppression
                const cartItem = button.closest('.cart-item');
                cartItem.style.transition = 'all 0.3s ease';
                cartItem.style.opacity = '0';
                cartItem.style.transform = 'translateX(-100%)';

                setTimeout(() => {
                    location.reload();
                }, 300);
            } else {
                throw new Error('Erreur lors de la suppression');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            button.innerHTML = '<i class="fas fa-trash"></i>';
            button.disabled = false;
            showToast('Erreur lors de la suppression', 'error');
        });
    }
}

function setupSearchFeatures() {
    const searchInput = document.querySelector('input[name="q"]');
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                // Ici on pourrait implémenter une recherche en temps réel
                // Pour l'instant, on se contente d'une animation
                animateSearchInput(this);
            }, 300);
        });
    }
}

function setupProductFilters() {
    // Gestion des vues grille/liste
    const gridViewBtn = document.getElementById('grid-view');
    const listViewBtn = document.getElementById('list-view');
    const productsGrid = document.getElementById('products-grid');
    
    if (gridViewBtn && listViewBtn && productsGrid) {
        listViewBtn.addEventListener('change', function() {
            if (this.checked) {
                productsGrid.classList.add('list-view');
                animateViewChange();
            }
        });
        
        gridViewBtn.addEventListener('change', function() {
            if (this.checked) {
                productsGrid.classList.remove('list-view');
                animateViewChange();
            }
        });
    }
}

function updateCartCount(count) {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        if (count !== undefined) {
            cartCountElement.textContent = count;
        }
        
        // Animation du compteur
        cartCountElement.style.transform = 'scale(1.3)';
        cartCountElement.style.transition = 'transform 0.2s ease';
        
        setTimeout(() => {
            cartCountElement.style.transform = 'scale(1)';
        }, 200);
    }
}

function showToast(message, type = 'info') {
    // Créer le toast
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    // Ajouter au container de toasts
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '1055';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toast);
    
    // Initialiser et afficher le toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 3000
    });
    bsToast.show();
    
    // Supprimer le toast après fermeture
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

function animateQuantityChange(element) {
    element.style.transform = 'scale(1.1)';
    element.style.transition = 'transform 0.2s ease';
    
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 200);
}

function animateSearchInput(element) {
    element.style.borderColor = '#1a73e8'; // Synchronisé avec --primary-color
    element.style.boxShadow = '0 0 0 0.2rem rgba(26, 115, 232, 0.25)';
    
    setTimeout(() => {
        element.style.borderColor = '';
        element.style.boxShadow = '';
    }, 1000);
}

function animateViewChange() {
    const products = document.querySelectorAll('.product-item');
    products.forEach((product, index) => {
        product.style.opacity = '0';
        product.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            product.style.transition = 'all 0.3s ease';
            product.style.opacity = '1';
            product.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

function initializeAnimations() {
    // Observer pour les animations au scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observer les éléments à animer
    const elementsToAnimate = document.querySelectorAll('.card, .product-card, .category-card');
    elementsToAnimate.forEach(element => {
        observer.observe(element);
    });
}

// Fonctions utilitaires
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
    // Ici on pourrait envoyer l'erreur à un service de monitoring
});

// Performance monitoring
window.addEventListener('load', function() {
    // Mesurer les performances de chargement
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    console.log('Temps de chargement:', loadTime + 'ms');
});

// Service Worker pour le cache (optionnel)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('Service Worker enregistré:', registration.scope);
            })
            .catch(function(error) {
                console.log('Erreur Service Worker:', error);
            });
    });
}