// Table of Contents Navigation JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Create sidebar element
  const sidebar = document.createElement('div');
  sidebar.className = 'toc-sidebar';
  
  // Create toggle button for mobile
  const toggleButton = document.createElement('button');
  toggleButton.className = 'toc-toggle';
  toggleButton.textContent = '☰ Menu';
  toggleButton.setAttribute('aria-label', 'Toggle table of contents');
  
  // Create title for the sidebar
  const tocTitle = document.createElement('div');
  tocTitle.className = 'toc-title';
  tocTitle.textContent = 'Table of Contents';
  
  // Find existing TOC and clone its content
  const existingToc = document.getElementById('table-of-contents');
  if (existingToc) {
    // Clone the TOC content (the ul element)
    const tocList = existingToc.querySelector('#text-table-of-contents').cloneNode(true);
    
    // Add elements to sidebar
    sidebar.appendChild(tocTitle);
    sidebar.appendChild(tocList);
    
    // Add sidebar to page
    document.body.appendChild(sidebar);
    document.body.appendChild(toggleButton);
    
    // Add wrapper to content
    const content = document.getElementById('content');
    if (content) {
      content.classList.add('content-with-sidebar');
      
      // Hide the original TOC
      existingToc.style.display = 'none';
    }
    
    // Toggle sidebar on button click for mobile
    toggleButton.addEventListener('click', function() {
      sidebar.classList.toggle('show');
    });
    
    // Track scroll position to highlight current section
    const headings = Array.from(document.querySelectorAll('h2, h3, h4, h5, h6'));
    const tocLinks = Array.from(sidebar.querySelectorAll('a'));
    
    window.addEventListener('scroll', function() {
      highlightCurrentSection(headings, tocLinks);
    });
    
    // Initial highlight
    highlightCurrentSection(headings, tocLinks);
  }
});

// Function to highlight the current section in the TOC
function highlightCurrentSection(headings, tocLinks) {
  // Get current scroll position
  const scrollY = window.scrollY;
  
  // Find the current heading
  let currentHeadingIndex = -1;
  
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const rect = heading.getBoundingClientRect();
    
    // Check if the heading is at the top of the viewport or above
    if (rect.top <= 50) {
      currentHeadingIndex = i;
    } else {
      break;
    }
  }
  
  // Remove active class from all links
  tocLinks.forEach(link => link.classList.remove('toc-active'));
  
  // Add active class to current link
  if (currentHeadingIndex !== -1) {
    const currentHeading = headings[currentHeadingIndex];
    const headingId = currentHeading.id;
    
    const activeLink = tocLinks.find(link => link.getAttribute('href') === '#' + headingId);
    if (activeLink) {
      activeLink.classList.add('toc-active');
    }
  }
}

// Close sidebar when clicking a link (for mobile)
document.addEventListener('click', function(e) {
  if (e.target.tagName === 'A' && e.target.closest('.toc-sidebar') && window.innerWidth <= 1024) {
    document.querySelector('.toc-sidebar').classList.remove('show');
  }
});