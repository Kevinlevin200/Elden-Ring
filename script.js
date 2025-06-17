class EldenRingApp {
    constructor() {
        this.baseURL = 'https://eldenring.fanapis.com/api';
        this.data = { bosses: [], weapons: [], classes: [], spirits: [] };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupScrollAnimations();
        this.loadAllData();
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                this.navigateToSection(e.target.getAttribute('href').substring(1));
                document.getElementById('hamburger').classList.remove('active');
                document.getElementById('navLinks').classList.remove('active');
            });
        });

        document.getElementById('hamburger').addEventListener('click', () => {
            document.getElementById('hamburger').classList.toggle('active');
            document.getElementById('navLinks').classList.toggle('active');
        });

        ['bossSearch', 'weaponSearch', 'spiritSearch'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', e => 
                this.filterContent(id.replace('Search', 's').toLowerCase(), e.target.value)
            );
        });

        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        document.querySelector('.cta-button')?.addEventListener('click', e => {
            e.preventDefault();
            this.navigateToSection('bosses');
        });
    }

    navigateToSection(section) {
        document.querySelector('.section.active').classList.remove('active');
        document.getElementById(section).classList.add('active');
        document.querySelector('.nav-link.active').classList.remove('active');
        document.querySelector(`[href="#${section}"]`).classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setupScrollAnimations() {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }

    async loadAllData() {
        try {
            await Promise.all([
                this.loadData('bosses', 20),
                this.loadData('weapons', 30),
                this.loadData('classes'),
                this.loadData('spirits', 20)
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async loadData(type, limit = '') {
        try {
            const response = await fetch(`${this.baseURL}/${type}${limit ? `?limit=${limit}` : ''}`);
            this.data[type] = (await response.json()).data || [];
            this[`render${type.charAt(0).toUpperCase() + type.slice(1)}`]();
            if (type === 'weapons') this.createWeaponFilters();
        } catch (error) {
            console.error(`Error loading ${type}:`, error);
            this.showError(`${type}Grid`, `Error al cargar ${type}`);
        } finally {
            document.getElementById(`${type}Loading`).style.display = 'none';
        }
    }

    renderBosses(bosses = this.data.bosses) {
        this.renderGrid('bossesGrid', bosses, boss => `
            <div class="card fade-in">
                <div class="card-image">${boss.image ? `<img src="${boss.image}" alt="${boss.name}">` : '👹'}</div>
                <h3>${boss.name || 'Desconocido'}</h3>
                <p><strong>Región:</strong> ${boss.region || '-'}</p>
                <p>${boss.description || 'Sin descripción'}</p>
                ${boss.drops?.length ? `<p><strong>Recompensas:</strong> ${boss.drops.join(', ')}</p>` : ''}
            </div>
        `);
    }

    renderWeapons(weapons = this.data.weapons) {
        this.renderGrid('weaponsGrid', weapons, weapon => `
            <div class="card fade-in">
                <div class="card-image">${weapon.image ? `<img src="${weapon.image}" alt="${weapon.name}">` : '⚔️'}</div>
                <h3>${weapon.name || 'Desconocida'}</h3>
                <p><strong>Categoría:</strong> ${weapon.category || '-'}</p>
                <p>${weapon.description || 'Sin descripción'}</p>
            </div>
        `);
    }

    renderClasses(classes = this.data.classes) {
        this.renderGrid('classesGrid', classes, cls => `
            <div class="card fade-in">
                <div class="card-image">${cls.image ? `<img src="${cls.image}" alt="${cls.name}">` : '🛡️'}</div>
                <h3>${cls.name || 'Desconocida'}</h3>
                <p>${cls.description || 'Sin descripción'}</p>
            </div>
        `);
    }

    renderSpirits(spirits = this.data.spirits) {
        this.renderGrid('spiritsGrid', spirits, spirit => `
            <div class="card fade-in">
                <div class="card-image">${spirit.image ? `<img src="${spirit.image}" alt="${spirit.name}">` : '👻'}</div>
                <h3>${spirit.name || 'Desconocido'}</h3>
                <p>${spirit.description || 'Sin descripción'}</p>
                <p><strong>Efecto:</strong> ${spirit.effect || '-'}</p>
            </div>
        `);
    }

    renderGrid(containerId, items, template) {
        const grid = document.getElementById(containerId);
        grid.innerHTML = items.length ? items.map(template).join('') : '<p>No se encontraron resultados.</p>';
        this.observeNewElements();
    }

    createWeaponFilters() {
        const categories = [...new Set(this.data.weapons.map(w => w.category).filter(Boolean))];
        const filters = document.getElementById('weaponFilters');
        filters.innerHTML = `<button class="filter-btn active" data-category="all">Todas</button>` +
            categories.map(cat => `<button class="filter-btn" data-category="${cat}">${cat}</button>`).join('');

        filters.addEventListener('click', e => {
            if (e.target.classList.contains('filter-btn')) {
                document.querySelector('.filter-btn.active').classList.remove('active');
                e.target.classList.add('active');
                const cat = e.target.dataset.category;
                this.renderWeapons(cat === 'all' ? this.data.weapons : this.data.weapons.filter(w => w.category === cat));
            }
        });
    }

    filterContent(type, term) {
        const search = term.toLowerCase();
        const filtered = this.data[type].filter(item =>
            item.name?.toLowerCase().includes(search) ||
            item.description?.toLowerCase().includes(search) ||
            item.region?.toLowerCase().includes(search) ||
            item.category?.toLowerCase().includes(search) ||
            item.effect?.toLowerCase().includes(search)
        );
        this[`render${type.charAt(0).toUpperCase() + type.slice(1)}`](filtered);
    }

    showError(containerId, message) {
        document.getElementById(containerId).innerHTML = `<p style="text-align: center;">⚠️ ${message}</p>`;
    }

    observeNewElements() {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.fade-in:not(.visible)').forEach(el => observer.observe(el));
    }

    toggleTheme() {
        const root = document.documentElement;
        const isDark = root.style.getPropertyValue('--text') !== '#333';
        root.style.setProperty('--text', isDark ? '#333' : '#f5f5f5');
        root.style.setProperty('--bg-dark', isDark ? '#f8f9fa' : '#0d0d0d');
        root.style.setProperty('--secondary', isDark ? '#e9ecef' : '#1a1a1a');
        root.style.setProperty('--card-bg', isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(26, 26, 26, 0.9)');
        document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
        document.body.style.background = `linear-gradient(135deg, ${root.style.getPropertyValue('--bg-dark')}, ${root.style.getPropertyValue('--secondary')})`;
    }
}

document.addEventListener('DOMContentLoaded', () => new EldenRingApp());