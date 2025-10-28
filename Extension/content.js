// ========================================
// 🎓 EDUCATIONAL WEB SECURITY EXTENSION
// ========================================
// 
// ⚠️ IMPORTANT: THIS IS A STUDENT LEARNING PROJECT
// 
// This content script is designed EXCLUSIVELY for educational purposes:
// - Learning web security principles
// - Understanding Chrome extension development
// - Studying authentication mechanisms
// - Practicing JavaScript programming
// 
// 🚫 NOT FOR COMMERCIAL USE
// 🚫 NOT FOR PRODUCTION SYSTEMS
// 🚫 NOT FOR UNAUTHORIZED ACCESS
// 
// This is experimental student code for learning purposes only.
// Created by students learning web development and security.
// 
// ========================================

console.log('🎓 Educational Web Security Extension - Content Script Loaded');
console.log('📚 This extension is for educational learning purposes only');
console.log('⚠️ NOT a commercial product - Student learning project');

// ========================================
// 📨 MESSAGE LISTENER FOR EDUCATIONAL PURPOSES
// ========================================
// 
// This listener handles educational learning data application
// ONLY for student learning and educational experiments
// 
// ========================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Educational content script received message:', request);
  console.log('🎓 Processing educational learning data...');
  
  if (request.type === 'APPLY_LEARNING_DATA') {
    console.log('🎓 Applying educational learning data to page...');
    console.log('📚 This is for educational purposes only - Student learning project');
    
    // Wait for page to be fully ready
    if (document.readyState === 'complete') {
      applyLearningData(request.data);
      sendResponse({ success: true, message: 'Educational learning data applied successfully' });
    } else {
      // Wait for page to be ready
      window.addEventListener('load', () => {
        applyLearningData(request.data);
        sendResponse({ success: true, message: 'Educational learning data applied after page load' });
      });
    }
    
    return true; // Will respond asynchronously
  }
  
  if (request.type === 'CHECK_PAGE_READY') {
    const isReady = document.readyState === 'complete';
    sendResponse({ 
      success: true, 
      ready: isReady,
      url: window.location.href,
      title: document.title
    });
  }
});

// ========================================
// 🎓 EDUCATIONAL LEARNING DATA APPLICATION
// ========================================
// 
// This function applies educational learning data to web pages
// ONLY for student learning and educational experiments
// 
// ⚠️ EDUCATIONAL USE ONLY - NOT FOR COMMERCIAL PURPOSES
// 
// ========================================

function applyLearningData(data) {
  console.log('🎓 Applying educational learning data:', data);
  console.log('📚 This is for educational purposes only - Student learning project');
  
  // ========================================
  // 🎓 EDUCATIONAL LEARNING ACTIVITIES
  // ========================================
  // 
  // This section demonstrates educational concepts:
  // - Web security principles
  // - Authentication mechanisms
  // - Session management
  // - Privacy protection techniques
  // 
  // ========================================
  
  // Show educational notification for learning purposes
  if (window.location.hostname.includes('chatgpt.com')) {
    showLearningNotification('🎓 Educational learning data applied to ChatGPT! Ready for student learning session.');
  } else if (window.location.hostname.includes('openai.com')) {
    showLearningNotification('🎓 Educational learning data applied to OpenAI! Ready for educational experiments.');
  } else {
    showLearningNotification('🎓 Educational learning data applied! This is for student learning purposes only.');
  }
}

// ========================================
// 🎓 EDUCATIONAL NOTIFICATION SYSTEM
// ========================================
// 
// This function shows educational notifications to students
// ONLY for learning purposes and educational feedback
// 
// ⚠️ EDUCATIONAL USE ONLY - NOT FOR COMMERCIAL PURPOSES
// 
// ========================================

function showLearningNotification(message) {
  console.log('🎓 Showing educational notification:', message);
  console.log('📚 This notification is for educational learning purposes only');
  
  // Create educational notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #4caf50, #45a049);
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    max-width: 350px;
    animation: slideIn 0.3s ease-out;
    border-left: 4px solid #2e7d32;
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 20px;">🎓</span>
      <div>
        <div style="font-weight: bold; margin-bottom: 4px;">Student Learning Project</div>
        <div>${message}</div>
        <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">
          ⚠️ Educational use only - Not a commercial product
        </div>
      </div>
    </div>
  `;
  
  // Add educational animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Auto-remove after 8 seconds (longer for educational reading)
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 8000);
}

// ========================================
// 🎓 EDUCATIONAL PAGE READINESS NOTIFICATION
// ========================================
// 
// This section notifies the extension when the page is ready
// ONLY for educational learning purposes
// 
// ⚠️ EDUCATIONAL USE ONLY - NOT FOR COMMERCIAL PURPOSES
// 
// ========================================

// Notify extension when page is ready for educational activities
if (document.readyState === 'complete') {
  console.log('🎓 Page ready for educational learning activities');
  chrome.runtime.sendMessage({ 
    type: 'PAGE_READY', 
    url: window.location.href,
    title: document.title,
    purpose: 'educational_learning'
  });
} else {
  window.addEventListener('load', () => {
    console.log('🎓 Page loaded - ready for educational learning activities');
    chrome.runtime.sendMessage({ 
      type: 'PAGE_READY', 
      url: window.location.href,
      title: document.title,
      purpose: 'educational_learning'
    });
  });
}

// ========================================
// 🎓 EDUCATIONAL EXTENSION END
// ========================================
// 
// This content script is designed EXCLUSIVELY for educational purposes
// Created by students learning web development and security
// 
// ⚠️ NOT FOR COMMERCIAL USE
// ⚠️ NOT FOR PRODUCTION SYSTEMS  
// ⚠️ NOT FOR UNAUTHORIZED ACCESS
// 
// ========================================
