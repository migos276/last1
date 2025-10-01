// JavaScript pour l'interface d'administration

document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
    setupAdminEventListeners();
    initializeCharts();
    setupDataTables();
});

function initializeAdmin() {
    // Initialiser les tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialiser les modals
    setupModals();
    
    // Charger les statistiques en temps réel
    loadRealTimeStats();
    
    // Auto-refresh des données toutes les 30 secondes
    setInterval(loadRealTimeStats, 30000);
}

function setupAdminEventListeners() {
    // Gestion des formulaires de produits
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    
    // Gestion de l'upload d'images
    const imageInput = document.getElementById('product-image');
    if (imageInput) {
        imageInput.addEventListener('change', handleImagePreview);
    }
    
    // Mise à jour du statut des transactions
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('update-status-btn')) {
            handleStatusUpdate(e);
        }
        
        if (e.target.classList.contains('delete-product-btn')) {
            handleProductDelete(e);
        }
    });
    
    // Filtres et recherche
    setupAdminFilters();
    
    // Export de données
    setupDataExport();
}

function handleProductSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Animation de chargement
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enregistrement...';
    submitBtn.disabled = true;
    
    // Validation côté client
    if (!validateProductForm(form)) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
    }
    
    // Soumettre le formulaire
    const formData = new FormData(form);
    
    fetch(form.action, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            showAdminToast('Produit enregistré avec succès!', 'success');
            setTimeout(() => {
                window.location.href = 'admin/products';
            }, 1500);
        } else {
            throw new Error('Erreur lors de l\'enregistrement');
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        showAdminToast('Erreur lors de l\'enregistrement', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function validateProductForm(form) {
    const name = form.querySelector('[name="name"]').value.trim();
    const price = form.querySelector('[name="price"]').value;
    const category = form.querySelector('[name="category_id"]').value;
    
    if (!name) {
        showAdminToast('Le nom du produit est requis', 'error');
        return false;
    }
    
    if (!price || parseFloat(price) <= 0) {
        showAdminToast('Le prix doit être supérieur à 0', 'error');
        return false;
    }
    
    if (!category) {
        showAdminToast('Veuillez sélectionner une catégorie', 'error');
        return false;
    }
    
    return true;
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('image-preview');
    
    if (file) {
        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
            showAdminToast('Veuillez sélectionner un fichier image', 'error');
            e.target.value = '';
            return;
        }
        
        // Vérifier la taille (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showAdminToast('L\'image ne doit pas dépasser 5MB', 'error');
            e.target.value = '';
            return;
        }
        
        // Afficher l'aperçu
        const reader = new FileReader();
        reader.onload = function(e) {
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" class="img-fluid rounded" style="max-height: 200px;">`;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }
}

function handleStatusUpdate(e) {
    const button = e.target;
    const transactionId = button.getAttribute('data-transaction-id');
    const currentStatus = button.getAttribute('data-current-status');
    
    // Créer le modal de mise à jour du statut
    const modal = createStatusUpdateModal(transactionId, currentStatus);
    document.body.appendChild(modal);
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Nettoyer le modal après fermeture
    modal.addEventListener('hidden.bs.modal', function() {
        modal.remove();
    });
}

function createStatusUpdateModal(transactionId, currentStatus) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Mettre à jour le statut</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="status-update-form">
                        <div class="mb-3">
                            <label class="form-label">Nouveau statut</label>
                            <select class="form-select" name="status" required>
                                <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>En attente</option>
                                <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>Terminé</option>
                                <option value="cancelled" ${currentStatus === 'cancelled' ? 'selected' : ''}>Annulé</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Montant réel (optionnel)</label>
                            <input type="number" class="form-control" name="real_amount" step="0.01" placeholder="Montant réellement payé">
                        </div>
                        <input type="hidden" name="transaction_id" value="${transactionId}">
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                    <button type="button" class="btn btn-primary" onclick="submitStatusUpdate()">Mettre à jour</button>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

function submitStatusUpdate() {
    const form = document.getElementById('status-update-form');
    const formData = new FormData(form);
    
    fetch('api/transaction/update', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAdminToast('Statut mis à jour avec succès!', 'success');
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            throw new Error(data.message || 'Erreur lors de la mise à jour');
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        showAdminToast('Erreur lors de la mise à jour', 'error');
    });
}

function handleProductDelete(e) {
    const button = e.target;
    const productId = button.getAttribute('data-product-id');
    const productName = button.getAttribute('data-product-name');
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer le produit "${productName}" ?`)) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `admin/products/delete/${productId}`;
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]');
        if (csrfToken) {
            const tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = 'csrf_token';
            tokenInput.value = csrfToken.getAttribute('content');
            form.appendChild(tokenInput);
        }
        
        document.body.appendChild(form);
        form.submit();
    }
}

function setupAdminFilters() {
    // Filtres de date
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput && endDateInput) {
        [startDateInput, endDateInput].forEach(input => {
            input.addEventListener('change', function() {
                updateAnalytics();
            });
        });
    }
    
    // Recherche en temps réel
    const searchInput = document.getElementById('admin-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performAdminSearch(this.value);
            }, 300);
        });
    }
}

function setupDataExport() {
    const exportButtons = document.querySelectorAll('.export-btn');
    exportButtons.forEach(button => {
        button.addEventListener('click', function() {
            const format = this.getAttribute('data-format');
            const type = this.getAttribute('data-type');
            exportData(format, type);
        });
    });
}

function exportData(format, type) {
    const startDate = document.getElementById('start-date')?.value || '';
    const endDate = document.getElementById('end-date')?.value || '';
    
    const params = new URLSearchParams({
        format: format,
        type: type,
        start_date: startDate,
        end_date: endDate
    });
    
    window.open(`admin/export?${params.toString()}`, '_blank');
}

function initializeCharts() {
    // Graphique des ventes quotidiennes
    initializeDailySalesChart();
    
    // Graphique des canaux de contact
    initializeChannelChart();
    
    // Graphique des produits les plus vendus
    initializeTopProductsChart();
    
    // KPIs en temps réel
    initializeKPICharts();
}

function initializeDailySalesChart() {
    const ctx = document.getElementById('daily-sales-chart');
    if (!ctx) return;
    
    fetch('api/analytics/data?type=daily&days=30')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const chartData = data.data;
                
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.map(item => item.date),
                        datasets: [{
                            label: 'Transactions',
                            data: chartData.map(item => item.transactions),
                            borderColor: '#007bff',
                            backgroundColor: 'rgba(0, 123, 255, 0.1)',
                            tension: 0.4,
                            fill: true
                        }, {
                            label: 'Ventes terminées',
                            data: chartData.map(item => item.completed),
                            borderColor: '#28a745',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'Évolution des ventes (30 derniers jours)'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        },
                        animation: {
                            duration: 2000,
                            easing: 'easeInOutQuart'
                        }
                    }
                });
            }
        })
        .catch(error => console.error('Erreur lors du chargement des données:', error));
}

function initializeChannelChart() {
    const ctx = document.getElementById('channel-chart');
    if (!ctx) return;
    
    fetch('api/analytics/data?type=channel')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const chartData = data.data;
                
                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: chartData.map(item => {
                            const channelNames = {
                                'whatsapp': 'WhatsApp',
                                'messenger': 'Messenger',
                                'email': 'Email',
                                'phone': 'Téléphone'
                            };
                            return channelNames[item.contact_channel] || item.contact_channel;
                        }),
                        datasets: [{
                            data: chartData.map(item => item.total_contacts),
                            backgroundColor: [
                                '#25D366', // WhatsApp green
                                '#1877F2', // Facebook blue
                                '#EA4335', // Email red
                                '#FFC107'  // Phone yellow
                            ],
                            borderWidth: 2,
                            borderColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                            },
                            title: {
                                display: true,
                                text: 'Répartition par canal de contact'
                            }
                        },
                        animation: {
                            animateRotate: true,
                            duration: 2000
                        }
                    }
                });
            }
        })
        .catch(error => console.error('Erreur lors du chargement des données:', error));
}

function initializeTopProductsChart() {
    const ctx = document.getElementById('top-products-chart');
    if (!ctx) return;
    
    // Simuler des données pour les produits les plus vendus
    const sampleData = [
        { name: 'Smartphone Galaxy Pro', sales: 45 },
        { name: 'Casque Bluetooth Premium', sales: 32 },
        { name: 'Cafetière Expresso', sales: 28 },
        { name: 'Crème Hydratante Bio', sales: 24 },
        { name: 'T-shirt Coton Bio', sales: 18 }
    ];
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sampleData.map(item => item.name),
            datasets: [{
                label: 'Ventes',
                data: sampleData.map(item => item.sales),
                backgroundColor: 'rgba(0, 123, 255, 0.8)',
                borderColor: '#007bff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Top 5 des produits les plus vendus'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 5
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutBounce'
            }
        }
    });
}

function initializeKPICharts() {
    // Graphique de conversion
    const conversionCtx = document.getElementById('conversion-chart');
    if (conversionCtx) {
        new Chart(conversionCtx, {
            type: 'gauge',
            data: {
                datasets: [{
                    data: [75, 25], // 75% de conversion
                    backgroundColor: ['#28a745', '#e9ecef'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                circumference: 180,
                rotation: 270,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Taux de conversion: 75%'
                    }
                }
            }
        });
    }
}

function setupDataTables() {
    // Initialiser DataTables pour les tableaux admin
    const tables = document.querySelectorAll('.admin-table');
    tables.forEach(table => {
        if (typeof DataTable !== 'undefined') {
            new DataTable(table, {
                pageLength: 25,
                responsive: true,
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/fr-FR.json'
                },
                order: [[0, 'desc']], // Trier par ID décroissant par défaut
                columnDefs: [
                    {
                        targets: -1, // Dernière colonne (actions)
                        orderable: false,
                        searchable: false
                    }
                ]
            });
        }
    });
}

function setupModals() {
    // Configuration globale des modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('show.bs.modal', function() {
            // Animation d'entrée
            this.querySelector('.modal-dialog').style.transform = 'scale(0.8)';
            this.querySelector('.modal-dialog').style.opacity = '0';
            
            setTimeout(() => {
                this.querySelector('.modal-dialog').style.transition = 'all 0.3s ease';
                this.querySelector('.modal-dialog').style.transform = 'scale(1)';
                this.querySelector('.modal-dialog').style.opacity = '1';
            }, 10);
        });
    });
}

function loadRealTimeStats() {
    // Charger les statistiques en temps réel
    fetch('api/analytics/realtime')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateStatCards(data.stats);
            }
        })
        .catch(error => console.error('Erreur lors du chargement des stats:', error));
}

function updateStatCards(stats) {
    // Mettre à jour les cartes de statistiques
    const statElements = {
        'total-transactions': stats.totalTransactions,
        'completed-sales': stats.completedSales,
        'total-revenue': stats.totalRevenue,
        'conversion-rate': stats.conversionRate
    };
    
    Object.entries(statElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            // Animation de mise à jour
            element.style.transform = 'scale(1.1)';
            element.style.transition = 'transform 0.2s ease';
            
            setTimeout(() => {
                element.textContent = value;
                element.style.transform = 'scale(1)';
            }, 100);
        }
    });
}

function updateAnalytics() {
    const startDate = document.getElementById('start-date')?.value;
    const endDate = document.getElementById('end-date')?.value;
    
    if (startDate && endDate) {
        // Recharger les graphiques avec les nouvelles dates
        location.reload(); // Simplification - en production, on rechargerait via AJAX
    }
}

function performAdminSearch(query) {
    // Recherche en temps réel dans l'interface admin
    const searchableElements = document.querySelectorAll('.searchable');
    
    searchableElements.forEach(element => {
        const text = element.textContent.toLowerCase();
        const matches = text.includes(query.toLowerCase());
        
        element.style.display = matches || query === '' ? '' : 'none';
        
        if (matches && query !== '') {
            // Surligner les résultats
            highlightSearchResults(element, query);
        }
    });
}

function highlightSearchResults(element, query) {
    const text = element.innerHTML;
    const regex = new RegExp(`(${query})`, 'gi');
    const highlightedText = text.replace(regex, '<mark>$1</mark>');
    element.innerHTML = highlightedText;
}

function showAdminToast(message, type = 'info') {
    // Créer le toast admin
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
    
    // Ajouter au container
    let toastContainer = document.getElementById('admin-toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'admin-toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '1055';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toast);
    
    // Afficher le toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 4000
    });
    bsToast.show();
    
    // Nettoyer après fermeture
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

// Fonctions utilitaires pour l'admin
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

function formatDate(dateString) {
    return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(dateString));
}

function formatNumber(number) {
    return new Intl.NumberFormat('fr-FR').format(number);
}

// Gestion des raccourcis clavier pour l'admin
document.addEventListener('keydown', function(e) {
    // Ctrl+S pour sauvegarder
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const saveBtn = document.querySelector('button[type="submit"]');
        if (saveBtn) {
            saveBtn.click();
        }
    }
    
    // Échap pour fermer les modals
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            bootstrap.Modal.getInstance(openModal).hide();
        }
    }
});

// Auto-sauvegarde des brouillons (optionnel)
function setupAutoSave() {
    const forms = document.querySelectorAll('form[data-autosave]');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(() => {
                saveFormDraft(form);
            }, 2000));
        });
    });
}

function saveFormDraft(form) {
    const formData = new FormData(form);
    const draftData = {};
    
    for (let [key, value] of formData.entries()) {
        draftData[key] = value;
    }
    
    localStorage.setItem(`draft_${form.id}`, JSON.stringify(draftData));
}

function loadFormDraft(form) {
    const draftData = localStorage.getItem(`draft_${form.id}`);
    if (draftData) {
        const data = JSON.parse(draftData);
        Object.entries(data).forEach(([key, value]) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = value;
            }
        });
    }
}

// Utilitaire debounce
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