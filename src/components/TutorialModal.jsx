import React, { useState, useRef } from 'react';

export default function TutorialModal() {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return !localStorage.getItem('seen_tutorial');
    }
    return false;
  });
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 3;

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleDismiss = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('seen_tutorial', 'true');
    }
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const swipeThreshold = 50;

    if (distance > swipeThreshold) {
      // Swiped left, go to next
      handleNext();
    } else if (distance < -swipeThreshold) {
      // Swiped right, go to back
      handleBack();
    }
    
    // Reset values
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  if (!isOpen) return null;

  return (
    <div className="tutorial-overlay" style={{ zIndex: 9999 }}>
      <div className="tutorial-modal" style={{ overflow: 'hidden' }}>
        <h2>Scout's Guide</h2>
        
        <div 
          className="tutorial-slider-container"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="tutorial-slider" style={{ transform: `translateX(-${(currentPage * 100) / totalPages}%)` }}>
            
            {/* Page 1 */}
            <div className="tutorial-page">
              <p>
                <strong>Welcome to Camp!</strong><br /><br />
                Pick a category below to start building your scout avatar. You can mix and match eyes, hair, clothes, and accessories!
              </p>
              <div style={{ textAlign: 'center', fontSize: '3rem', margin: '20px 0' }}>⛺</div>
            </div>

            {/* Page 2 */}
            <div className="tutorial-page">
              <p>
                You can adjust the position of the <strong>currently selected part</strong> directly on the canvas!
              </p>
              <div className="tutorial-gestures">
                <div className="tutorial-gesture">
                  <span className="tutorial-gesture-icon">🤏</span>
                  <span><strong>Pinch</strong> to resize</span>
                </div>
                <div className="tutorial-gesture">
                  <span className="tutorial-gesture-icon">🤚</span>
                  <span><strong>Drag</strong> to move</span>
                </div>
                <div className="tutorial-gesture">
                  <span className="tutorial-gesture-icon">🔄</span>
                  <span><strong>Twist</strong> to rotate</span>
                </div>
              </div>
            </div>

            {/* Page 3 */}
            <div className="tutorial-page">
              <p>
                <strong>Finalize your Badge!</strong><br /><br />
                Don't forget to visit the <strong>Badge</strong> and <strong>Text</strong> tabs to customize your colors. <br /><br />
                When you're happy with your design, click <strong>Finish ID</strong>!
              </p>
              <div style={{ textAlign: 'center', fontSize: '3rem', margin: '20px 0' }}>🏅</div>
            </div>

          </div>
        </div>

        <div className="tutorial-nav">
          <div style={{ width: '80px', display: 'flex', justifyContent: 'flex-start' }}>
            <button 
              className="tutorial-nav-btn" 
              style={{ visibility: currentPage > 0 ? 'visible' : 'hidden', padding: '6px 12px' }}
              onClick={handleBack}
            >
              Back
            </button>
          </div>
          
          <div className="tutorial-dots">
            {[0, 1, 2].map(idx => (
              <div key={idx} className={`tutorial-dot ${currentPage === idx ? 'active' : ''}`} />
            ))}
          </div>

          <div style={{ width: '80px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="tutorial-nav-btn primary" 
              style={{ padding: '6px 12px' }}
              onClick={handleNext}
            >
              {currentPage === totalPages - 1 ? 'Start!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
