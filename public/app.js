document.addEventListener('DOMContentLoaded', () => {
    const loadComponent = async (component, selector) => {
        try {
            const response = await fetch(component);
            if (!response.ok) throw new Error(`Failed to load ${component}`);
            const text = await response.text();
            const element = document.querySelector(selector);
            if (element) element.innerHTML = text;
        } catch (error) {
            console.error(error);
        }
    };
    Promise.all([
        loadComponent('header.html', '#header-placeholder'),
        loadComponent('footer.html', '#footer-placeholder')
    ]);
});