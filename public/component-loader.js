// public/component-loader.js
const componentsLoadedEvent = new Event('componentsLoaded');

async function loadComponents() {
    const headerPlaceholder = document.querySelector('header.site-header');
    const footerPlaceholder = document.querySelector('footer.site-footer');
    
    let modalsPlaceholder = document.getElementById('modals-placeholder');
    if (!modalsPlaceholder) {
        modalsPlaceholder = document.createElement('div');
        modalsPlaceholder.id = 'modals-placeholder';
        document.body.appendChild(modalsPlaceholder);
    }

    try {
        const [headerRes, footerRes, modalsRes] = await Promise.all([
            fetch('header.html'),
            fetch('footer.html'),
            fetch('modals.html')
        ]);

        if (headerPlaceholder && headerRes.ok) headerPlaceholder.innerHTML = await headerRes.text();
        if (footerPlaceholder && footerRes.ok) footerPlaceholder.innerHTML = await footerRes.text();
        if (modalsPlaceholder && modalsRes.ok) modalsPlaceholder.innerHTML = await modalsRes.text();
        
    } catch (error) {
        console.error("Error loading components:", error);
    } finally {
        document.dispatchEvent(componentsLoadedEvent);
    }
}

document.addEventListener('DOMContentLoaded', loadComponents);