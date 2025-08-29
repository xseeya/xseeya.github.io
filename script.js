function toggleTheme() {
    const themeSwitcher = document.querySelector('.theme-switcher');
    const isDarkMode = document.body.classList.toggle('dark-mode');
    const theme = isDarkMode ? 'dark' : 'light';

    // Update icon
    themeSwitcher.textContent = isDarkMode ? '🌓' : '🌞';

    // Animate theme change
    document.body.style.transition = 'none';
    if (isDarkMode) {
        document.body.style.background = 'linear-gradient(135deg, #d0d7ff 0%, #b7c2fe 100%)';
    } else {
        document.body.style.background = 'linear-gradient(135deg, #0a0a1a 0%, #1a1a33 100%)';
    }

    setTimeout(() => {
        document.body.style.transition = 'background 0.5s ease';
        applyTheme();
    }, 50);

    localStorage.setItem('theme', theme);
}

function applyTheme() {
    if (document.body.classList.contains('dark-mode')) {
        document.body.style.background = 'linear-gradient(135deg, #0a0a1a 0%, #1a1a33 100%)';
    } else {
        document.body.style.background = 'linear-gradient(135deg, #d0d7ff 0%, #b7c2fe 100%)';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('.theme-switcher').textContent = '🌓';
    } else {
        document.querySelector('.theme-switcher').textContent = '🌞';
    }
    applyTheme();

    // Add tooltip functionality
    const links = document.querySelectorAll('.link-tooltip');
    links.forEach(link => {
        const url = link.getAttribute('data-url');

        // Create a new span for the URL
        const urlSpan = document.createElement('span');
        urlSpan.textContent = url;
        urlSpan.style.display = 'none';
        urlSpan.style.position = 'absolute';
        urlSpan.style.left = '50%';
        urlSpan.style.transform = 'translateX(-50%)';
        urlSpan.style.zIndex = '2';
        urlSpan.style.color = 'white';
        link.appendChild(urlSpan);

        link.addEventListener('mouseenter', function() {
            urlSpan.style.display = 'block';
        });

        link.addEventListener('mouseleave', function() {
            urlSpan.style.display = 'none';
        });

        link.addEventListener('click', function(e) {
            e.preventDefault();
            const fullUrl = link.getAttribute('href');
            window.open(fullUrl, '_blank');
        });
    });
});
